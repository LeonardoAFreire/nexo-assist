import type { ConversationState } from '@nexo/contracts';

export type PausedState = 'waiting_analyst' | 'with_analyst';

export function isPausedState(state: ConversationState): state is PausedState {
  return state === 'waiting_analyst' || state === 'with_analyst';
}
