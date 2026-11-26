import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import argon2 from 'argon2';
import { type Model } from 'mongoose';
import { randomBytes, randomUUID } from 'node:crypto';
import { ApiError } from '../api-error.js';
import { APP_CONFIG, type AppConfig } from '../config.js';
import { User } from '../users/user.schema.js';
import { UsersService } from '../users/users.service.js';
import { type AuthResultDto, type SignInDto, type SignUpDto } from './auth.dto.js';
import { Session } from './session.schema.js';

const hashOptions = { type: argon2.argon2id, memoryCost: 19 * 1024, timeCost: 2, parallelism: 1 } as const;

interface SessionClaims {
  sub: string;
  jti: string;
  exp: number;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    @InjectModel(Session.name) private readonly sessions: Model<Session>,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit() {
    await this.sessions.init();
    this.dummyHash = await argon2.hash(randomBytes(32), hashOptions);
  }

  async signUp({ name, email, password }: SignUpDto) {
    const passwordHash = await argon2.hash(password, hashOptions);
    const user = await this.users.create({ name, email, passwordHash });
    return this.issueSession(user.id, user);
  }

  async signIn({ email, password }: SignInDto) {
    const user = await this.users.findForSignIn(email);
    const matches = await argon2.verify(user?.passwordHash ?? this.dummyHash, password);
    if (!user || !matches) throw new ApiError(401, 'Invalid email or password.');
    return this.issueSession(user.id, user);
  }

  async readClaims(token?: string): Promise<SessionClaims | null> {
    if (!token) return null;
    try {
      const claims = await this.jwt.verifyAsync<SessionClaims>(token);
      if (
        typeof claims.sub === 'string' && /^[a-f\d]{24}$/.test(claims.sub) &&
        typeof claims.jti === 'string' && claims.jti.length === 36 &&
        typeof claims.exp === 'number'
      ) return claims;
    } catch {
      return null;
    }
    return null;
  }

  async getAccount(claims: SessionClaims): Promise<AuthResultDto> {
    const session = await this.sessions.exists({
      _id: claims.jti,
      userId: claims.sub,
      expiresAt: { $gt: new Date() },
    });
    const user = session && await this.users.findById(claims.sub);
    if (!user) throw new ApiError(401, 'Sign in to continue.');
    return this.toResult(user, claims.exp * 1000);
  }

  async logout(token?: string) {
    const claims = await this.readClaims(token);
    if (claims) {
      await this.sessions.deleteOne({ _id: claims.jti, userId: claims.sub }).exec();
    }
  }

  private async issueSession(userId: string, user: User) {
    const jti = randomUUID();
    const exp = Math.floor(Date.now() / 1000) + this.config.sessionSeconds;
    const expiresAt = exp * 1000;
    const token = await this.jwt.signAsync({ sub: userId, jti, exp });
    await this.sessions.create({ _id: jti, userId, expiresAt: new Date(expiresAt) });
    return { token, result: this.toResult(user, expiresAt) };
  }

  private toResult({ name, email }: User, expiresAt: number): AuthResultDto {
    return { user: { name, email }, expiresAt };
  }
}
