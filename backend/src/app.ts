import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { ApiError, ApiErrorFilter } from './api-error.js';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config.js';

export async function createApp(config: AppConfig) {
  // Startup errors from dependencies can contain configuration values.
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(config),
    new ExpressAdapter(),
    { abortOnError: false, logger: false, bodyParser: false },
  );
  app.set('trust proxy', config.trustProxyHops || false);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApiErrorFilter());
  app.use(helmet({
    strictTransportSecurity: config.cookie.secure ? undefined : false,
    contentSecurityPolicy: {
      directives: config.cookie.secure ? {} : { 'upgrade-insecure-requests': null },
    },
  }));
  app.use('/api/auth', (_request: Request, response: Response, next: NextFunction) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.useBodyParser('json', { limit: '8kb' });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => {
      const fields: Record<string, string> = {};
      for (const { property, constraints } of errors) {
        if (['name', 'email', 'password'].includes(property) && constraints) {
          fields[property] = Object.values(constraints)[0];
        }
      }
      return Object.keys(fields).length
        ? new ApiError(400, 'Check the highlighted fields.', fields)
        : new ApiError(400, 'Send only supported fields.');
    },
  }));

  if (config.mode !== 'production') {
    const options = new DocumentBuilder()
      .setTitle('Apex Authentication')
      .setDescription('For authentication POST requests, use this UI on the configured app origin. Cookies are set and sent by the browser.')
      .setVersion('1.0')
      .addCookieAuth(config.cookieName)
      .build();
    SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, options));
  }

  return app;
}
