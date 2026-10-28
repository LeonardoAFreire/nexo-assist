import type { NexoUIMessage, TurnError } from '../types/nexo-ui-message.js';
import type { TurnFeedback } from './chat-stream-effects.js';

const RECORDED_FAILURE_MESSAGE =
  'Não consegui responder agora. Tente de novo ou fale com um analista.';

function recordedFailure(message: NexoUIMessage | undefined): TurnError | null {
  if (message?.role !== 'assistant') {
    return null;
  }
  const failure = message.metadata?.failure;
  if (failure !== undefined) {
    return failure;
  }
  const persisted = message.metadata?.message;
  if (persisted?.author !== 'agent' || persisted.status !== 'failed') {
    return null;
  }
  return { message: persisted.text || RECORDED_FAILURE_MESSAGE, retryable: true };
}

export function currentTurnError(
  messages: NexoUIMessage[],
  feedback: TurnFeedback,
  active: boolean,
): TurnError | null {
  if (active) {
    return null;
  }
  return feedback.error ?? recordedFailure(messages.at(-1));
}
