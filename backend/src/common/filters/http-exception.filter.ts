import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorPayload {
  code: string;
  message: string | string[];
  statusCode: number;
  path: string;
  timestamp: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        message = raw;
      } else if (raw !== null && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if (Array.isArray(obj.message)) {
          message = obj.message as string[];
          details = obj.message;
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        }
        if (typeof obj.error === 'string') {
          code = obj.error.toUpperCase().replace(/\s+/g, '_');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
      this.logger.error(`Unhandled error at ${request.method} ${request.url}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception type at ${request.method} ${request.url}`, exception);
    }

    const payload: ErrorPayload = {
      code,
      message,
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (details !== undefined) {
      payload.details = details;
    }

    response.status(statusCode).json({ error: payload });
  }
}
