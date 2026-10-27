import { type ConsoleList, type ConsoleListQuery, consoleListSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

export async function listConsoleConversations(query: ConsoleListQuery): Promise<ConsoleList> {
  const params = { filter: query.filter, q: query.q || undefined };
  const response = await http.get<unknown>('/console/conversations', { params });
  return consoleListSchema.parse(response.data);
}
