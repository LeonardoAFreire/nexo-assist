import type { ApiRequestError } from '@/lib/api-request-error';

const GENERIC_CREDENTIALS_MESSAGE = 'E-mail ou senha incorretos.';
const CREDENTIAL_ERROR_CODES: readonly string[] = ['invalid_credentials', 'validation_error'];

export function loginErrorMessage(error: ApiRequestError): string {
  if (CREDENTIAL_ERROR_CODES.includes(error.code)) {
    return GENERIC_CREDENTIALS_MESSAGE;
  }
  return error.message;
}
