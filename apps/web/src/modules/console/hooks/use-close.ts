import type { UseMutationResult } from '@tanstack/react-query';
import { useAttendanceAction } from './use-attendance-action.js';

export function useClose(conversationId: string): UseMutationResult<unknown, Error, void> {
  return useAttendanceAction(conversationId, 'close');
}
