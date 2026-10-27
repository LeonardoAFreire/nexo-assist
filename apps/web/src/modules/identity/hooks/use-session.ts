import type { SessionUser } from '@nexo/contracts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getMe } from '../api/get-me.js';
import { sessionKeys } from './session-keys.js';

export function useSession(): UseQueryResult<SessionUser | null> {
  return useQuery({ queryKey: sessionKeys.current, queryFn: getMe });
}
