import { type SessionUser, sessionUserSchema } from '@nexo/contracts';
import { isApiRequestError } from '@/lib/api-request-error';
import { http } from '@/lib/http';

export async function getMe(): Promise<SessionUser | null> {
  try {
    const response = await http.get<unknown>('/auth/me');
    return sessionUserSchema.parse(response.data);
  } catch (error: unknown) {
    if (isApiRequestError(error) && error.code === 'unauthenticated') {
      return null;
    }
    throw error;
  }
}
