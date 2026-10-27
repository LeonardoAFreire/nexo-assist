import type { Conversation } from '@nexo/contracts';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ApiRequestError } from '@/lib/api-request-error';
import { requestHandoff } from '../api/request-handoff.js';
import { chatKeys } from './chat-keys.js';

export function useRequestHandoff(): UseMutationResult<Conversation, ApiRequestError, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestHandoff,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversation }),
  });
}
