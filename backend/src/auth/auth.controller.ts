import {
  Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiCreatedResponse,
  ApiForbiddenResponse, ApiNoContentResponse, ApiOkResponse, ApiResponse,
  ApiTags, ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { APP_CONFIG, type AppConfig } from '../config.js';
import { AuthResultDto, ErrorDto, SignInDto, SignUpDto } from './auth.dto.js';
import { type AccountRequest, AuthGuard, OriginGuard } from './auth.guards.js';
import { AuthService } from './auth.service.js';

@ApiTags('Authentication')
@ApiResponse({ status: 429, description: 'Rate limit exceeded', type: ErrorDto })
@UseGuards(ThrottlerGuard)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Post('signup')
  @UseGuards(OriginGuard)
  @Throttle({ default: { limit: 8 } })
  @ApiCreatedResponse({ type: AuthResultDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  @ApiForbiddenResponse({ type: ErrorDto })
  @ApiConflictResponse({ type: ErrorDto })
  async signUp(
    @Body() body: SignUpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, result } = await this.auth.signUp(body);
    this.setSessionCookie(response, token, result.expiresAt);
    return result;
  }

  @Post('signin')
  @HttpCode(200)
  @UseGuards(OriginGuard)
  @Throttle({ default: { limit: 12 } })
  @ApiOkResponse({ type: AuthResultDto })
  @ApiBadRequestResponse({ type: ErrorDto })
  @ApiForbiddenResponse({ type: ErrorDto })
  @ApiUnauthorizedResponse({ type: ErrorDto })
  async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, result } = await this.auth.signIn(body);
    this.setSessionCookie(response, token, result.expiresAt);
    return result;
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(OriginGuard)
  @Throttle({ default: { limit: 30 } })
  @ApiCookieAuth()
  @ApiNoContentResponse({ description: 'Session revoked and cookie cleared' })
  @ApiForbiddenResponse({ type: ErrorDto })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies[this.config.cookieName];
    await this.auth.logout(token);
    response.clearCookie(this.config.cookieName, this.config.cookie);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiCookieAuth()
  @ApiOkResponse({ type: AuthResultDto })
  @ApiUnauthorizedResponse({ type: ErrorDto })
  me(@Req() request: AccountRequest) {
    return request.account;
  }

  private setSessionCookie(response: Response, token: string, expiresAt: number): void {
    response.cookie(this.config.cookieName, token, {
      ...this.config.cookie,
      expires: new Date(expiresAt),
    });
  }
}
