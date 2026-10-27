import { type ConsoleEmployeeTickets, consoleEmployeeTicketsSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

export async function listEmployeeTickets(conversationId: string): Promise<ConsoleEmployeeTickets> {
  const response = await http.get<unknown>(`/console/conversations/${conversationId}/tickets`);
  return consoleEmployeeTicketsSchema.parse(response.data);
}
