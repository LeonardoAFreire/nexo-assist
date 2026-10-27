import type { ConsoleEmployeeTickets } from '@nexo/contracts';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { listEmployeeTickets } from '../api/list-employee-tickets.js';
import { consoleKeys } from './console-keys.js';

export function useEmployeeTickets(
  conversationId: string,
  enabled: boolean,
): UseQueryResult<ConsoleEmployeeTickets> {
  return useQuery({
    queryKey: consoleKeys.tickets(conversationId),
    queryFn: () => listEmployeeTickets(conversationId),
    enabled,
  });
}
