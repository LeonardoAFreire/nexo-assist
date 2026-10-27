import type { ConsoleConversationDetail } from '@nexo/contracts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getConsoleConversation } from '../api/get-conversation.js';
import { consoleKeys } from './console-keys.js';

export function useConsoleConversation(
  conversationId: string,
): UseQueryResult<ConsoleConversationDetail> {
  return useQuery({
    queryKey: consoleKeys.conversation(conversationId),
    queryFn: () => getConsoleConversation(conversationId),
  });
}
