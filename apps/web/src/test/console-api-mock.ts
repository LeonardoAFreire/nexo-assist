import type { UserProfile } from '@nexo/contracts';
import { HttpResponse, http as mswHttp, sse, type HttpHandler } from 'msw';
import { consoleActionHandlers } from './console-actions-mock';
import {
  buildList,
  type ConsoleBackend,
  type ConsoleStreamEventName,
  type ConsoleRecord,
  requireRecord,
} from './console-backend-state';
import { apiUrl } from './server';

const UNAVAILABLE_STATUS = 503;
export const CONSOLE_BASE = '/console/conversations';

function queryHandlers(backend: ConsoleBackend): HttpHandler[] {
  return [
    mswHttp.get(apiUrl(CONSOLE_BASE), ({ request }) => {
      const query = new URL(request.url).searchParams;
      return HttpResponse.json(buildList(backend.records, query, backend.analyst));
    }),
    mswHttp.get(apiUrl(`${CONSOLE_BASE}/:id`), ({ params }) => {
      const { conversation, timeline } = requireRecord(backend, params.id);
      return HttpResponse.json({ conversation, timeline });
    }),
    mswHttp.get(apiUrl(`${CONSOLE_BASE}/:id/tickets`), () => {
      if (backend.tickets) {
        return HttpResponse.json(backend.tickets);
      }
      const error = { code: 'tickets_unavailable', message: 'Chamados indisponíveis.' };
      return HttpResponse.json({ error }, { status: UNAVAILABLE_STATUS });
    }),
  ];
}

export function consoleApiMock(records: ConsoleRecord[], analyst: UserProfile): ConsoleBackend {
  const emptyTickets = { fromConversation: [], others: { open: [], closed: [] } };
  const backend: ConsoleBackend = {
    records,
    analyst,
    tickets: emptyTickets,
    client: null,
    handlers: [],
  };
  const stream = sse<Record<ConsoleStreamEventName, unknown>>(
    apiUrl('/console/events'),
    ({ client }) => {
      backend.client = client;
    },
  );
  backend.handlers = [...queryHandlers(backend), ...consoleActionHandlers(backend), stream];
  return backend;
}
