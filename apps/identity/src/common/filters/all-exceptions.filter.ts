import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

interface FilterRequest {
  method: string;
  url: string;
}

interface FilterReply {
  status(statusCode: number): {
    send(body: unknown): void;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FilterReply>();
    const request = ctx.getRequest<FilterRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code: number = status;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null && 'message' in res) {
        const resObj = res as { message: string | string[] };
        message = Array.isArray(resObj.message)
          ? resObj.message.join(', ')
          : resObj.message;
      } else {
        message = exception.message;
      }
      code = status;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Resource already exists';
          code = status;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Resource not found';
          code = status;
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database error';
          code = status;
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation error';
      code = status;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} => ${status}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).send({
      success: false,
      code,
      message,
      data: null,
    });
  }
}
