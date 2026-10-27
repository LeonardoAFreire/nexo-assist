import type { UseMutationResult } from '@tanstack/react-query';
import { useClaim } from './use-claim.js';
import { useClose } from './use-close.js';
import { useRelease } from './use-release.js';

type Mutation = UseMutationResult<unknown, Error, void>;

export type Attendance = {
  claim: Mutation;
  release: Mutation;
  close: Mutation;
  error: Error | null;
  busy: boolean;
};

export function useAttendance(conversationId: string): Attendance {
  const claim = useClaim(conversationId);
  const release = useRelease(conversationId);
  const close = useClose(conversationId);
  return {
    claim,
    release,
    close,
    error: claim.error ?? release.error ?? close.error,
    busy: claim.isPending || release.isPending || close.isPending,
  };
}
