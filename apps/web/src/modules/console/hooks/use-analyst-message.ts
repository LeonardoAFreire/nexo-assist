import type { ChatMessage, ConsoleConversationDetail } from '@nexo/contracts';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { sendAnalystMessage } from '../api/send-analyst-message.js';
import { appendMessage } from './apply-console-event.js';
import { consoleKeys } from './console-keys.js';

export function useAnalystMessage(
  conversationId: string,
): UseMutationResult<ChatMessage, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => sendAnalystMessage(conversationId, { text }),
    onSuccess: (message: ChatMessage) => {
      queryClient.setQueryData<ConsoleConversationDetail>(
        consoleKeys.conversation(conversationId),
        (detail) => appendMessage(detail, message),
      );
      return queryClient.invalidateQueries({ queryKey: consoleKeys.lists });
    },
  });
}
