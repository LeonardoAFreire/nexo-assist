import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { type AttendanceAction, runAttendanceAction } from '../api/attendance-actions.js';
import { consoleKeys } from './console-keys.js';

export function useAttendanceAction(
  conversationId: string,
  action: AttendanceAction,
): UseMutationResult<unknown, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => runAttendanceAction(conversationId, action),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: consoleKeys.conversation(conversationId) }),
        queryClient.invalidateQueries({ queryKey: consoleKeys.tickets(conversationId) }),
        queryClient.invalidateQueries({ queryKey: consoleKeys.lists }),
      ]),
  });
}
