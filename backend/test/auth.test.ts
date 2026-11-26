import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { after, before, test } from 'node:test';
import { JwtService } from '@nestjs/jwt';
import { getConnectionToken } from '@nestjs/mongoose';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Connection } from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { SignUpDto } from '../src/auth/auth.dto.js';
import { readConfig } from '../src/config.js';

const origin = 'http://apex.test';
const database = `apex_test_${randomUUID().replaceAll('-', '')}`;
const credentials = { name: '  Alex Morgan  ', email: '  Alex@Example.com  ', password: 'Abcdef1!' };
const profile = { name: 'Alex Morgan', email: 'alex@example.com' };

let app: NestExpressApplication;
let db: Connection;
let cookie: string;
let otherCookie: string;
let isolatedUri: string;

function api() {
  return request(app.getHttpServer());
}

function post(endpoint: string) {
  return api().post(`/api/auth/${endpoint}`).set('Origin', origin);
}

function sessionCookie(response: request.Response) {
  const raw = response.headers['set-cookie']?.[0];
  assert.ok(raw, 'A session cookie should be present');
  assert.match(raw, /^apex_session=/);
  assert.match(raw, /; HttpOnly/);
  assert.match(raw, /; SameSite=Strict/);
  assert.match(raw, /; Path=\//);
  assert.match(raw, /; Expires=/);
  assert.doesNotMatch(raw, /; Secure/);
  return raw.split(';')[0];
}

function assertSession(response: request.Response, user = profile) {
  assert.deepEqual(Object.keys(response.body).sort(), ['expiresAt', 'user']);
  assert.deepEqual(response.body.user, user);
  assert.ok(response.body.expiresAt > Date.now());
  assert.equal(response.headers['cache-control'], 'no-store');
}

before(async () => {
  const uri = process.env.TEST_MONGO_URI;
  assert.ok(uri, 'Set TEST_MONGO_URI to an isolated MongoDB server.');
  const testUri = new URL(uri);
  testUri.pathname = `/${database}`;
  isolatedUri = testUri.href;
  app = await createApp(readConfig({
    NODE_ENV: 'test',
    APP_ORIGIN: origin,
    JWT_SECRET: randomBytes(32).toString('hex'),
    SESSION_TTL_SECONDS: '60',
    MONGO_URI: isolatedUri,
  }));
  await app.init();
  db = app.get<Connection>(getConnectionToken());
  assert.equal(db.name, database);
});

after(async () => {
  try {
    if (db?.name === database) await db.dropDatabase();
  } finally {
    await app?.close();
  }
});

test('reports health and documents the auth API', async () => {
  await api().get('/api/health').expect(200, { status: 'ok' });
  const docs = await api().get('/api/docs-json').expect(200);
  assert.ok(docs.body.paths['/api/auth/signup'].post);
  assert.ok(docs.body.paths['/api/auth/me'].get.security.length);
  assert.doesNotMatch(JSON.stringify(docs.body), /passwordHash/);
});

test('registers a trimmed, normalized user and uses an Argon2id hash', async () => {
  const response = await post('signup').send(credentials).expect(201);
  assertSession(response);
  cookie = sessionCookie(response);
  const user = await db.collection('users').findOne({ email: profile.email });
  assert.ok(user);
  assert.match(user.passwordHash, /^\$argon2id\$/);
  assert.notEqual(user.passwordHash, credentials.password);
  assert.ok((await db.collection('users').indexes()).some((index) => index.key.email === 1 && index.unique));
  assert.ok((await db.collection('sessions').indexes()).some((index) =>
    index.key.expiresAt === 1 && index.expireAfterSeconds === 0));
});

test('rejects invalid or unsupported registration fields', async () => {
  const response = await post('signup').send({ name: ' x ', email: 'bad@', password: 'onlyletters' }).expect(400);
  assert.deepEqual(Object.keys(response.body.fields).sort(), ['email', 'name', 'password']);
  await post('signup').send({ ...credentials, email: 'a..b@example.com' }).expect(400);
  await post('signup').send({ ...credentials, role: 'extra' }).expect(400);
});

test('rejects registration password line breaks and preserves spaces', () => {
  const password = ` ${credentials.password} `;
  const valid = plainToInstance(SignUpDto, { ...credentials, password });
  assert.deepEqual(validateSync(valid), []);
  assert.equal(valid.password, password);

  for (const lineBreak of ['\r', '\n']) {
    const invalid = plainToInstance(SignUpDto, { ...credentials, password: password + lineBreak });
    assert.deepEqual(validateSync(invalid).map((error) => error.property), ['password']);
  }
});

test('rejects the losing signup in a duplicate email race', async () => {
  const responses = await Promise.all([
    post('signup').send({ ...credentials, email: 'Race@Example.com' }),
    post('signup').send({ ...credentials, email: '  race@example.com  ' }),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(await db.collection('users').countDocuments({ email: 'race@example.com' }), 1);
  const conflict = responses.find((response) => response.status === 409);
  assert.ok(conflict?.body.fields.email);
});

test('signs in and returns only the public account fields', async () => {
  const { email, password } = credentials;
  const response = await post('signin').send({ email, password }).expect(200);
  assertSession(response);
  otherCookie = sessionCookie(response);
});

test('returns the same error for an unknown user and an incorrect password', async () => {
  const first = await post('signin').send({ email: 'unknown@example.com', password: 'not it' }).expect(401);
  const second = await post('signin').send({ email: profile.email, password: 'not it' }).expect(401);
  assert.deepEqual(first.body, { statusCode: 401, message: 'Invalid email or password.' });
  assert.deepEqual(second.body, first.body);
});

test('requires a valid unexpired session for the protected account', async () => {
  await api().get('/api/auth/me').expect(401).expect('Cache-Control', 'no-store');
  await api().get('/api/auth/me').set('Cookie', 'apex_session=invalid').expect(401);
  const jwt = app.get(JwtService);
  const claims = jwt.decode<{ sub: string; jti: string }>(cookie.slice('apex_session='.length));
  const expired = jwt.sign({ sub: claims.sub, jti: claims.jti, exp: Math.floor(Date.now() / 1000) - 1 });
  await api().get('/api/auth/me').set('Cookie', `apex_session=${expired}`).expect(401);
  assertSession(await api().get('/api/auth/me').set('Cookie', cookie).expect(200));
});

test('requires the configured origin on all authentication writes', async () => {
  await api().post('/api/auth/signup').send(credentials).expect(403);
  await api().post('/api/auth/signin').set('Origin', 'http://other.apex.test').send(credentials).expect(403);
  await api().post('/api/auth/logout').set('Origin', 'null').set('Cookie', cookie).expect(403);
  await api().get('/api/auth/me').set('Cookie', cookie).expect(200);
});

test('logs out, expires the cookie, and rejects the revoked session', async () => {
  const response = await post('logout').set('Cookie', cookie).expect(204);
  assert.equal(response.text, '');
  assert.match(response.headers['set-cookie'][0], /^apex_session=;/);
  assert.match(response.headers['set-cookie'][0], /Expires=Thu, 01 Jan 1970/);
  await api().get('/api/auth/me').set('Cookie', cookie).expect(401);
  await api().get('/api/auth/me').set('Cookie', otherCookie).expect(200);
  await post('logout').set('Cookie', cookie).expect(204);
});

test('requires an explicit mode for HTTPS and defaults HTTP to development', () => {
  const settings = {
    APP_ORIGIN: 'https://apex.test',
    JWT_SECRET: randomBytes(32).toString('hex'),
    MONGO_URI: isolatedUri,
  };
  assert.throws(() => readConfig(settings), /NODE_ENV must be explicitly set/);
  assert.equal(readConfig({ ...settings, NODE_ENV: 'development' }).mode, 'development');

  const http = readConfig({ ...settings, APP_ORIGIN: origin });
  assert.equal(http.mode, 'development');
  assert.equal(http.cookie.secure, false);
});

test('uses an HTTPS-only host cookie and disables Swagger in production', async () => {
  const settings = {
    NODE_ENV: 'production',
    APP_ORIGIN: 'https://apex.test',
    JWT_SECRET: randomBytes(32).toString('hex'),
    MONGO_URI: isolatedUri,
  };
  assert.throws(() => readConfig({ ...settings, APP_ORIGIN: origin }), /HTTPS in production/);
  const production = await createApp(readConfig(settings));
  try {
    await production.init();
    const productionApi = request(production.getHttpServer());
    const response = await productionApi.post('/api/auth/signin')
      .set('Origin', settings.APP_ORIGIN)
      .send({ email: profile.email, password: credentials.password })
      .expect(200);
    const raw = response.headers['set-cookie'][0];
    assert.match(raw, /^__Host-apex_session=/);
    assert.match(raw, /; Secure/);
    assert.match(raw, /; HttpOnly/);
    assert.match(raw, /; SameSite=Strict/);
    assert.match(raw, /; Path=\//);
    assert.doesNotMatch(raw, /; Domain=/i);
    await productionApi.get('/api/docs-json').expect(404);
  } finally {
    await production.close();
  }
});

test('returns sanitized errors for malformed request bodies', async () => {
  const response = await post('signin').set('Content-Type', 'application/json').send('{"password":"example"').expect(400);
  assert.deepEqual(response.body, { statusCode: 400, message: 'Bad Request' });
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
});

test('limits repeated requests to the sign-in endpoint', async () => {
  let status = 400;
  for (let attempt = 0; attempt < 13 && status !== 429; attempt++) {
    const response = await post('signin').send({});
    status = response.status;
    if (status === 429) assert.ok(Number(response.headers['retry-after']) > 0);
  }
  assert.equal(status, 429);
});
