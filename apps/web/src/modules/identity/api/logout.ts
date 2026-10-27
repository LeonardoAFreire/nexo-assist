import { http } from '@/lib/http';

export async function logout(): Promise<void> {
  await http.post('/auth/logout');
}
