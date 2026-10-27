import { type Conversation, conversationSchema, type RequestHandoffRequest } from '@nexo/contracts';
import { http } from '@/lib/http';

const HANDOFF_REQUEST: RequestHandoffRequest = { reason: 'requested' };

export async function requestHandoff(): Promise<Conversation> {
  const response = await http.post<unknown>('/conversations/current/handoff', HANDOFF_REQUEST);
  return conversationSchema.parse(response.data);
}
