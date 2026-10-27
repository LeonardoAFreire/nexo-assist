import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribeConsoleEvents } from '../api/subscribe-console-events.js';
import { applyConsoleEvent } from './apply-console-event.js';
import { consoleKeys } from './console-keys.js';

export function useConsoleEvents(conversationId: string | undefined): void {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      subscribeConsoleEvents({
        conversationId,
        onEvent: (event) => applyConsoleEvent(queryClient, event),
        onReconnect: () => void queryClient.invalidateQueries({ queryKey: consoleKeys.scope }),
      }),
    [conversationId, queryClient],
  );
}
