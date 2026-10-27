import { type LoginRequest, type SessionUser, sessionUserSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

export async function login(request: LoginRequest): Promise<SessionUser> {
  const response = await http.post<unknown>('/auth/login', request);
  return sessionUserSchema.parse(response.data);
}
