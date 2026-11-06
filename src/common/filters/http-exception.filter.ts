import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: any = 'Internal Server Error';
    let errorDetails: any = null;

    if (isHttp) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || (res as any).error || exception.message;
        errorDetails = (res as any).error;
      } else {
        message = res;
      }
    } else if (process.env.NODE_ENV !== 'production') {
      message = (exception as any)?.message || String(exception);
    }

    // Log the error internally
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Status ${status} - Error: ${
          (exception as any)?.message || exception
        }`,
        (exception as any)?.stack,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - Status ${status} - Message: ${JSON.stringify(
          message,
        )}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message.join(', ') : message,
      ...(errorDetails && { error: errorDetails }),
    });
  }
}

