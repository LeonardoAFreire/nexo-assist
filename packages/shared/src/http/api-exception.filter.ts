import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiError } from '@nexo/contracts';
import { PinoLogger } from 'nestjs-pino';

const INTERNAL_ERROR_CODE = 'internal_error';
const INTERNAL_ERROR_MESSAGE = 'Erro interno. Tente novamente em instantes.';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('http');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host
      .switchToHttp()
      .getResponse<{ status(code: number): { json(body: ApiError): void } }>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error({ err: exception }, 'Falha não tratada');
    }
    response.status(status).json(this.toApiError(exception, status));
  }

  private toApiError(exception: unknown, status: number): ApiError {
    if (exception instanceof HttpException && status < HttpStatus.INTERNAL_SERVER_ERROR) {
      return { error: { code: exception.name, message: exception.message } };
    }
    return { error: { code: INTERNAL_ERROR_CODE, message: INTERNAL_ERROR_MESSAGE } };
  }
}
