import { isApiRequestError } from '@/lib/api-request-error';

const GENERIC_MESSAGE = 'Não consegui concluir a resposta. Tente de novo.';

export function turnErrorMessage(error: unknown): string {
  return isApiRequestError(error) ? error.message : GENERIC_MESSAGE;
}
