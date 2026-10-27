import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { markConversationRead } from '../api/mark-read.js';
import { consoleKeys } from './console-keys.js';

export function useMarkRead(conversationId: string, lastMessageId: string | undefined): void {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: () => markConversationRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consoleKeys.lists }),
  });
  useEffect(() => {
    if (lastMessageId) {
      mutate();
    }
  }, [conversationId, lastMessageId, mutate]);
}
