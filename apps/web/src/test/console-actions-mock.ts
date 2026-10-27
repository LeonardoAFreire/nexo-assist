import { analystMessageRequestSchema } from '@nexo/contracts';
import { HttpResponse, http as mswHttp, type HttpHandler } from 'msw';
import { claimRecord, type ConsoleBackend, requireRecord, setState } from './console-backend-state';
import { makeMessage } from './console-fixtures';
import { apiUrl } from './server';

const CONFLICT_STATUS = 409;
const NO_CONTENT_STATUS = 204;
const CREATED_STATUS = 201;
const BASE = '/console/conversations';

function claimHandler(backend: ConsoleBackend): HttpHandler {
  return mswHttp.post(apiUrl(`${BASE}/:id/claim`), ({ params }) => {
    const record = requireRecord(backend, params.id);
    if (record.conversation.state !== 'waiting_analyst') {
      const owner = record.conversation.assignedAnalyst?.name;
      const message = `Esta conversa já está sendo atendida por ${owner}.`;
      const error = { code: 'conversation_already_claimed', message };
      return HttpResponse.json({ error }, { status: CONFLICT_STATUS });
    }
    claimRecord(record, backend.analyst);
    return HttpResponse.json(record.conversation);
  });
}

function stateHandler(backend: ConsoleBackend, action: 'release' | 'close'): HttpHandler {
  return mswHttp.post(apiUrl(`${BASE}/:id/${action}`), ({ params }) => {
    const record = requireRecord(backend, params.id);
    setState(record, action === 'release' ? 'agent' : 'closed');
    return HttpResponse.json(record.conversation);
  });
}

function messageHandler(backend: ConsoleBackend): HttpHandler {
  return mswHttp.post(apiUrl(`${BASE}/:id/messages`), async ({ params, request }) => {
    const { text } = analystMessageRequestSchema.parse(await request.json());
    const record = requireRecord(backend, params.id);
    const sender = {
      author: 'analyst',
      authorName: backend.analyst.name,
      authorLevel: 'N2',
    } as const;
    const message = makeMessage({ conversationId: record.item.id, text, ...sender });
    record.timeline = [...record.timeline, message];
    return HttpResponse.json(message, { status: CREATED_STATUS });
  });
}

export function consoleActionHandlers(backend: ConsoleBackend): HttpHandler[] {
  return [
    claimHandler(backend),
    stateHandler(backend, 'release'),
    stateHandler(backend, 'close'),
    messageHandler(backend),
    mswHttp.post(
      apiUrl(`${BASE}/:id/read`),
      () => new HttpResponse(null, { status: NO_CONTENT_STATUS }),
    ),
  ];
}
