import { HttpException } from '@nestjs/common';
import type { ApiErrorCode } from '@nexo/contracts';

export type ApiHttpExceptionInput = {
  code: ApiErrorCode;
  message: string;
  status: number;
};

export class ApiHttpException extends HttpException {
  readonly code: ApiErrorCode;

  constructor(input: ApiHttpExceptionInput) {
    super(input.message, input.status);
    this.code = input.code;
  }
}
