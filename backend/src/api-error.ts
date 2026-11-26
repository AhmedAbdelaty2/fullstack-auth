import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  ConsoleLogger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Response } from 'express';

export class ApiError extends HttpException {
  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(fields ? { message, fields } : { message }, status);
  }
}

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new ConsoleLogger(ApiErrorFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = error instanceof HttpException ? error.getStatus() : 500;
    if (statusCode >= 500) this.logger.error('Request failed with a server error.');

    const details = error instanceof ApiError
      ? error.getResponse() as { message: string; fields?: Record<string, string> }
      : { message: STATUS_CODES[statusCode] ?? 'Request failed.' };

    response.status(statusCode).json({ statusCode, ...details });
  }
}
