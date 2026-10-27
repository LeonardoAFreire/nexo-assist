import { type AnalystMessageRequest, type ChatMessage, chatMessageSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

export async function sendAnalystMessage(
  conversationId: string,
  body: AnalystMessageRequest,
): Promise<ChatMessage> {
  const url = `/console/conversations/${conversationId}/messages`;
  const response = await http.post<unknown>(url, body);
  return chatMessageSchema.parse(response.data);
}
