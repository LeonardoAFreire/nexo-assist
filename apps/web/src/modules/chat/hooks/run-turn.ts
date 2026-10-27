import type { ChatStreamEvent } from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import type { Dispatch } from 'react';
import { applyEventToCache } from './conversation-cache.js';
import { turnErrorMessage } from './turn-error-message.js';
import type { TurnAction } from './turn-state.js';

const TERMINAL_EVENTS: ReadonlySet<ChatStreamEvent['event']> = new Set([
  'turn.completed',
  'turn.skipped',
  'turn.failed',
]);

export type RunTurnInput = {
  stream: AsyncGenerator<ChatStreamEvent>;
  signal: AbortSignal;
  dispatch: Dispatch<TurnAction>;
  queryClient: QueryClient;
};

const INTERRUPTED_MESSAGE = 'A resposta foi interrompida. Tente de novo.';

export async function runTurn(input: RunTurnInput): Promise<void> {
  const { stream, signal, dispatch, queryClient } = input;
  let finished = false;
  try {
    for await (const event of stream) {
      finished = TERMINAL_EVENTS.has(event.event);
      applyEventToCache(queryClient, event);
      dispatch({ type: 'event', event });
    }
  } catch (error: unknown) {
    if (!signal.aborted) {
      dispatch({ type: 'interrupted', message: turnErrorMessage(error) });
    }
    return;
  }
  if (!finished && !signal.aborted) {
    dispatch({ type: 'interrupted', message: INTERRUPTED_MESSAGE });
  }
}
