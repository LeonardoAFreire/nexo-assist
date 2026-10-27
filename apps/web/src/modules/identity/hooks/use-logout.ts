import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { logout } from '../api/logout.js';
import { sessionKeys } from './session-keys.js';

export function useLogout(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== sessionKeys.scope });
      queryClient.setQueryData(sessionKeys.current, null);
    },
  });
}
