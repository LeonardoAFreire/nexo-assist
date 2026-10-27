import type { ApiErrorCode } from '@nexo/contracts';

export type ApiRequestErrorInput = {
  code: ApiErrorCode;
  message: string;
  status: number;
};

export class ApiRequestError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(input: ApiRequestErrorInput, options?: ErrorOptions) {
    super(input.message, options);
    this.name = 'ApiRequestError';
    this.code = input.code;
    this.status = input.status;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}
