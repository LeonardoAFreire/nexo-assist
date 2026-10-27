import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/http';

type Health = { status: 'ok' };

async function fetchHealth(): Promise<Health> {
  const response = await http.get<Health>('/health');
  return response.data;
}

export function useApiHealth() {
  return useQuery({ queryKey: ['health'], queryFn: fetchHealth });
}
