import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { subscribeConversation } from '../api/subscribe-conversation.js';
import { applyConversationEvent } from './apply-conversation-event.js';
import { chatKeys } from './chat-keys.js';

export function useConversationEvents(): void {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      subscribeConversation({
        onEvent: (event) => applyConversationEvent(queryClient, event),
        onReconnect: () => void queryClient.invalidateQueries({ queryKey: chatKeys.conversation }),
      }),
    [queryClient],
  );
}
