import type { ChatMessage } from '@nexo/contracts';
import type { TurnError, TurnState } from './turn-state.js';

const RECORDED_FAILURE_MESSAGE =
  'Não consegui responder agora. Tente de novo ou fale com um analista.';

export function currentTurnError(timeline: ChatMessage[], turn: TurnState): TurnError | null {
  if (turn.status !== 'idle') {
    return turn.error;
  }
  const last = timeline.at(-1);
  if (last?.author !== 'agent' || last.status !== 'failed') {
    return null;
  }

  return { message: last.text || RECORDED_FAILURE_MESSAGE, retryable: true };
}
