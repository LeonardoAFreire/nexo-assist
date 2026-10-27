import type { EmployeeConversationView } from '@nexo/contracts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getCurrentConversation } from '../api/get-current-conversation.js';
import { chatKeys } from './chat-keys.js';

export function useConversation(): UseQueryResult<EmployeeConversationView> {
  return useQuery({ queryKey: chatKeys.conversation, queryFn: getCurrentConversation });
}
