import type { LoginRequest, SessionUser } from '@nexo/contracts';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ApiRequestError } from '@/lib/api-request-error';
import { login } from '../api/login.js';
import { sessionKeys } from './session-keys.js';

export function useLogin(): UseMutationResult<SessionUser, ApiRequestError, LoginRequest> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user: SessionUser) => queryClient.setQueryData(sessionKeys.current, user),
  });
}
