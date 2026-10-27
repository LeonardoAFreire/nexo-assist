import { type EmployeeConversationView, employeeConversationViewSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

export async function getCurrentConversation(): Promise<EmployeeConversationView> {
  const response = await http.get<unknown>('/conversations/current');
  return employeeConversationViewSchema.parse(response.data);
}
