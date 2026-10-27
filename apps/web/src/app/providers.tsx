import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import { setUnauthorizedHandler } from '@/lib/http';
import { createQueryClient } from '@/lib/query-client';
import { sessionKeys } from '@/modules/identity';

type ProvidersProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

export function Providers({ children, queryClient: providedClient }: ProvidersProps) {
  const [queryClient] = useState(() => providedClient ?? createQueryClient());
  useEffect(() => {
    setUnauthorizedHandler(() => queryClient.setQueryData(sessionKeys.current, null));
    return () => setUnauthorizedHandler(undefined);
  }, [queryClient]);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
