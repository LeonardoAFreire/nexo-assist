import { http } from '@/lib/http';

export async function markConversationRead(conversationId: string): Promise<void> {
  await http.post(`/console/conversations/${conversationId}/read`);
}
