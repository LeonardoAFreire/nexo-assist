import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribeConversation } from '../api/subscribe-conversation.js';
import type { TimelineUpdater } from '../types/nexo-ui-message.js';
import { applyConversationEvent } from './apply-conversation-event.js';
import { invalidateConversation } from './conversation-cache.js';

export function useConversationEvents(updateTimeline: TimelineUpdater): void {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      subscribeConversation({
        onEvent: (event) => applyConversationEvent({ queryClient, updateTimeline }, event),
        onReconnect: () => invalidateConversation(queryClient),
      }),
    [queryClient, updateTimeline],
  );
}
