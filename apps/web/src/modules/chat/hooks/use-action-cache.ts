import { useQueryClient } from '@tanstack/react-query';
import { isApiRequestError } from '@/lib/api-request-error';
import { useChatActions } from './chat-actions-context.js';
import { invalidateConversation } from './conversation-cache.js';
import type { ActionCacheTargets } from './pending-action-cache.js';

const NOT_FOUND_STATUS = 404;
const CONFLICT_STATUS = 409;

function isStale(error: Error): boolean {
  return (
    isApiRequestError(error) &&
    (error.status === NOT_FOUND_STATUS || error.status === CONFLICT_STATUS)
  );
}

export function useResyncOnStale(): (error: Error) => void {
  const queryClient = useQueryClient();
  return (error: Error) => {
    if (isStale(error)) {
      invalidateConversation(queryClient);
    }
  };
}

export function useCacheTargets(): ActionCacheTargets {
  const queryClient = useQueryClient();
  const { updateTimeline } = useChatActions();
  return { queryClient, updateTimeline };
}
