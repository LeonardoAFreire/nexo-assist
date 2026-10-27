import { type ConsoleConversationDetail, consoleConversationDetailSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

export async function getConsoleConversation(
  conversationId: string,
): Promise<ConsoleConversationDetail> {
  const response = await http.get<unknown>(`/console/conversations/${conversationId}`);
  return consoleConversationDetailSchema.parse(response.data);
}
