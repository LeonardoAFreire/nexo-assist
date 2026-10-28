import { isApiRequestError } from '@/lib/api-request-error';
import { InterruptedTurnError } from '../api/stream-chunks.js';

const GENERIC_MESSAGE = 'Não consegui concluir a resposta. Tente de novo.';

export function turnErrorMessage(error: unknown): string {
  if (isApiRequestError(error) || error instanceof InterruptedTurnError) {
    return error.message;
  }
  return GENERIC_MESSAGE;
}
