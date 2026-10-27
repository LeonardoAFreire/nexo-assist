# Exemplos de acesso ao backend

## Cliente axios (`src/lib/http.ts`)

```ts
import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})
```

## Módulo de acesso à API (`modules/tickets/api/list-tickets.ts`)

```ts
import type { Ticket } from '@nexo/contracts'
import { http } from '@/lib/http'

export async function listTickets(): Promise<Ticket[]> {
  const response = await http.get<Ticket[]>('/tickets')
  return response.data
}
```

## Hook com React Query (`modules/tickets/hooks/use-tickets.ts`)

```ts
import { useQuery } from '@tanstack/react-query'
import { listTickets } from '../api/list-tickets'

export const ticketKeys = {
  all: ['tickets'] as const,
}

export function useTickets() {
  return useQuery({ queryKey: ticketKeys.all, queryFn: listTickets })
}
```

## Mutação que invalida o cache

```ts
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (text: string) => sendMessage({ conversationId, text }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messageKeys.list(conversationId) }),
  })
}
```

## Componente consumindo o hook

```tsx
export function TicketList() {
  const { data, isPending, isError, refetch } = useTickets()
  if (isPending) return <LoadingMessage />
  if (isError) return <ErrorMessage onRetry={refetch} />
  return <TicketItems tickets={data} />
}
```
