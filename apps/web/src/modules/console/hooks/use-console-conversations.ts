import type { ConsoleList, ConsoleListQuery } from '@nexo/contracts';
import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { listConsoleConversations } from '../api/list-conversations.js';
import { consoleKeys } from './console-keys.js';

export function useConsoleConversations(query: ConsoleListQuery): UseQueryResult<ConsoleList> {
  return useQuery({
    queryKey: consoleKeys.list(query),
    queryFn: () => listConsoleConversations(query),
    placeholderData: keepPreviousData,
  });
}
