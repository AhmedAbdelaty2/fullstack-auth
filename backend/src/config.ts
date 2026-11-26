import type { CookieOptions } from 'express';

export const APP_CONFIG = Symbol('APP_CONFIG');

export function readConfig(env: NodeJS.ProcessEnv) {
  const mode = env.NODE_ENV ?? 'development';
  if (!['development', 'test', 'production'].includes(mode)) {
    throw new Error('NODE_ENV must be development, test, or production.');
  }

  const port = Number(env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const mongoUri = env.MONGO_URI;
  if (!mongoUri || !/^mongodb(?:\+srv)?:\/\/[^\s/]+\/[^\s/?#]+(?:\?[^\s#]*)?$/.test(mongoUri)) {
    throw new Error('MONGO_URI must be a MongoDB connection string with a database name.');
  }

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes.');
  }

  const sessionSeconds = Number(env.SESSION_TTL_SECONDS ?? '3600');
  if (!Number.isInteger(sessionSeconds) || sessionSeconds < 60 || sessionSeconds > 86400) {
    throw new Error('SESSION_TTL_SECONDS must be an integer between 60 and 86400.');
  }

  const trustProxyHops = Number(env.TRUST_PROXY_HOPS ?? '0');
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0 || trustProxyHops > 3) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 3.');
  }

  const secure = mode === 'production';
  const origin = URL.parse(env.APP_ORIGIN ?? '');
  if (
    !origin ||
    origin.origin !== env.APP_ORIGIN ||
    !['http:', 'https:'].includes(origin.protocol) ||
    (secure && origin.protocol !== 'https:')
  ) {
    throw new Error('APP_ORIGIN must be a canonical HTTP origin, using HTTPS in production.');
  }
  if (origin.protocol === 'https:' && env.NODE_ENV === undefined) {
    throw new Error('NODE_ENV must be explicitly set when APP_ORIGIN uses HTTPS.');
  }

  const cookie: CookieOptions = { httpOnly: true, secure, sameSite: 'strict', path: '/' };
  return {
    mode,
    port,
    mongoUri,
    jwtSecret,
    sessionSeconds,
    trustProxyHops,
    origin: origin.origin,
    cookie,
    cookieName: secure ? '__Host-apex_session' : 'apex_session',
  };
}

export type AppConfig = ReturnType<typeof readConfig>;
