import type { ApiErrorCode } from '@nexo/contracts';

export class ChatRuleError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ChatRuleError';
    this.code = code;
  }
}
