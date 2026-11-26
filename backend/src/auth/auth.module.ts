import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_CONFIG, type AppConfig } from '../config.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard, OriginGuard } from './auth.guards.js';
import { AuthService } from './auth.service.js';
import { Session, SessionSchema } from './session.schema.js';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtSecret,
        signOptions: { algorithm: 'HS256', issuer: 'apex', audience: 'apex-web' },
        verifyOptions: { algorithms: ['HS256'], issuer: 'apex', audience: 'apex-web' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, OriginGuard],
})
export class AuthModule {}
