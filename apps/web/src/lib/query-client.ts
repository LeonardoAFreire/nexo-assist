import { QueryClient } from '@tanstack/react-query';

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 1;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: STALE_TIME_MS, retry: MAX_RETRIES } },
  });
}
