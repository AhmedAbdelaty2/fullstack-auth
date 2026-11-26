import { type CanActivate, type ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { ApiError } from '../api-error.js';
import { APP_CONFIG, type AppConfig } from '../config.js';
import type { AuthResultDto } from './auth.dto.js';
import { AuthService } from './auth.service.js';

export interface AccountRequest extends Request {
  account: AuthResultDto;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AccountRequest>();
    const claims = await this.auth.readClaims(request.cookies[this.config.cookieName]);
    if (!claims) throw new ApiError(401, 'Sign in to continue.');
    request.account = await this.auth.getAccount(claims);
    return true;
  }
}

@Injectable()
export class OriginGuard implements CanActivate {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.get('Origin') !== this.config.origin) {
      throw new ApiError(403, 'Request origin is not allowed.');
    }
    return true;
  }
}
