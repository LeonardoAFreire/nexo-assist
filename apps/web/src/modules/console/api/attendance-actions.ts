import { type Conversation, conversationSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

export type AttendanceAction = 'claim' | 'release' | 'close';

export async function runAttendanceAction(
  conversationId: string,
  action: AttendanceAction,
): Promise<Conversation> {
  const response = await http.post<unknown>(`/console/conversations/${conversationId}/${action}`);
  return conversationSchema.parse(response.data);
}
