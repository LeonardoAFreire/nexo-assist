import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiError, ApiErrorCode } from '@nexo/contracts';
import { PinoLogger } from 'nestjs-pino';
import { ApiHttpException } from './api-http.exception.js';

const INTERNAL_ERROR_MESSAGE = 'Erro interno. Tente novamente em instantes.';

const CODE_BY_STATUS: Record<number, ApiErrorCode> = {
  [HttpStatus.BAD_REQUEST]: 'validation_error',
  [HttpStatus.UNAUTHORIZED]: 'unauthenticated',
  [HttpStatus.FORBIDDEN]: 'forbidden',
  [HttpStatus.NOT_FOUND]: 'not_found',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'validation_error',
  [HttpStatus.TOO_MANY_REQUESTS]: 'rate_limited',
};

type JsonResponse = { status(code: number): { json(body: ApiError): void } };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('http');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<JsonResponse>();
    const status = this.resolveStatus(exception);
    if (!(exception instanceof ApiHttpException) && status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception }, 'Falha não tratada');
    }
    response.status(status).json(this.toApiError(exception));
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof ApiHttpException) {
      return { error: { code: exception.code, message: exception.message } };
    }
    if (exception instanceof HttpException) {
      const code = CODE_BY_STATUS[exception.getStatus()];
      return code === undefined ? internalError() : { error: { code, message: exception.message } };
    }
    return internalError();
  }
}

function internalError(): ApiError {
  return { error: { code: 'internal_error', message: INTERNAL_ERROR_MESSAGE } };
}
