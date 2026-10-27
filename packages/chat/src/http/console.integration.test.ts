import {
  type ConsoleConversationDetail,
  type ConsoleEmployeeTickets,
  type ConsoleList,
  type TicketSummary,
  ticketSummarySchema,
  TicketsUnavailableError,
} from '@nexo/contracts';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { makeTicket } from '../core/testing/factories.js';
import { type ChatTestApp, startChatTestApp } from './testing/chat-test-app.js';
import { BRUNO, type ConsoleScenario, seedConsoleScenario } from './testing/console-scenario.js';

const LIST = '/console/conversations';
const UNKNOWN_ID = 'f47ac10b-58cc-4372-a567-0d02b2c3d479';
const SEARCH_MAX_LENGTH = 60;

let app: ChatTestApp;
let scenario: ConsoleScenario;

beforeAll(async () => {
  app = await startChatTestApp();
  scenario = await seedConsoleScenario(app);
});

afterAll(async () => {
  await app.close();
});

async function list(query: string, as: 'rafael' | 'gabriela' = 'rafael'): Promise<ConsoleList> {
  const { status, body } = await scenario[as].json<ConsoleList>('GET', `${LIST}${query}`);
  expect(status).toBe(200);
  return body;
}

describe('TI-12: lista, filtros, busca e contadores', () => {
  it('filtra por "Para você" com a mais antiga primeiro e conta todos os filtros', async () => {
    const { items, counters } = await list('?filter=for_you');
    const { waiting, waitingToo } = scenario.ids;
    expect(items.map((item) => item.id)).toEqual([waiting, waitingToo]);
    expect(counters).toEqual({ all: 4, for_you: 2, with_agent: 1, mine: 1 });
    expect(items[0]).toMatchObject({ consoleStatus: 'transferred', ticketNumbers: ['INC-20311'] });
  });

  it('filtra por "Com o agent" e por "Minhas" conforme o analista da sessão', async () => {
    const withAgent = await list('?filter=with_agent');
    const mine = await list('?filter=mine');
    const others = await list('?filter=mine', 'gabriela');
    expect(withAgent.items.map((item) => item.id)).toEqual([scenario.ids.agent]);
    expect(withAgent.items[0]?.consoleStatus).toBe('agent_attending');
    expect(mine.items.map((item) => item.id)).toEqual([scenario.ids.claimed]);
    expect(mine.items[0]?.consoleStatus).toBe('you_are_attending');
    expect(others.items).toEqual([]);
    expect(others.counters.mine).toBe(0);
    const forGabriela = await list('', 'gabriela');
    const claimed = forGabriela.items.find((item) => item.id === scenario.ids.claimed);
    expect(claimed?.consoleStatus).toBe('attended_by_other');
  });

  it('busca por número de chamado e por nome sem acento, e os contadores respeitam a busca', async () => {
    const byTicket = await list('?q=INC-20311&filter=with_agent');
    expect(byTicket.items).toEqual([]);
    expect(byTicket.counters).toEqual({ all: 2, for_you: 2, with_agent: 0, mine: 0 });
    const byName = await list('?q=TAVARES');
    expect(byName.items.map((item) => item.id)).toEqual([scenario.ids.waiting]);
    expect(byName.counters.all).toBe(1);
    const nobody = await list('?q=ninguem');
    expect(nobody).toEqual({ items: [], counters: { all: 0, for_you: 0, with_agent: 0, mine: 0 } });
  });

  it('recusa filtro desconhecido, busca longa demais e parâmetro extra', async () => {
    const queries = ['?filter=todas', `?q=${'a'.repeat(SEARCH_MAX_LENGTH + 1)}`, '?page=2'];
    const responses = await Promise.all(
      queries.map((q) => scenario.rafael.call('GET', `${LIST}${q}`)),
    );
    expect(responses.map((response) => response.status)).toEqual([400, 400, 400]);
  });
});

describe('detalhe e leitura', () => {
  it('devolve a conversa com o turn completo de cada resposta do agent', async () => {
    const path = `${LIST}/${scenario.ids.waiting}`;
    const { status, body } = await scenario.rafael.json<ConsoleConversationDetail>('GET', path);
    const reply = body.timeline.find((message) => message.author === 'agent');
    expect(status).toBe(200);
    expect(body.conversation.handoff?.summary).toContain('Último pedido');
    expect(reply?.turn?.steps.length).toBeGreaterThan(0);
    expect(reply?.turn?.decision.confidence.label).toBe('alta');
    expect(body.timeline.at(-1)?.author).toBe('system');
  });

  it('responde 404 a conversa inexistente e 400 a id malformado', async () => {
    const missing = await scenario.rafael.call('GET', `${LIST}/${UNKNOWN_ID}`);
    const malformed = await scenario.rafael.call('GET', `${LIST}/abc`);
    expect([missing.status, malformed.status]).toEqual([404, 400]);
  });

  it('read zera o contador de não lidas da conversa', async () => {
    const before = await list('?filter=for_you');
    const unread = (id: string) => before.items.find((item) => item.id === id)?.unreadCount;
    expect(unread(scenario.ids.waitingToo)).toBeGreaterThan(0);
    const read = await scenario.rafael.call('POST', `${LIST}/${scenario.ids.waitingToo}/read`);
    const after = await list('?filter=for_you');
    const item = after.items.find((candidate) => candidate.id === scenario.ids.waitingToo);
    expect([read.status, item?.unreadCount]).toEqual([204, 0]);
    const unknown = await scenario.rafael.call('POST', `${LIST}/${UNKNOWN_ID}/read`);
    expect(unknown.status).toBe(404);
  });
});

describe('TI-13: painel de chamados e acesso por papel', () => {
  const summary = (number: string, status: TicketSummary['status']) =>
    ticketSummarySchema.parse(makeTicket({ number, status }));

  it('libera os chamados do funcionário só para conversa transferida', async () => {
    app.tickets.setTickets(BRUNO!.id, [
      summary('INC-20311', 'open'),
      summary('INC-20150', 'resolved'),
      summary('REQ-10442', 'in_progress'),
    ]);
    const ok = await scenario.rafael.json<ConsoleEmployeeTickets>(
      'GET',
      `${LIST}/${scenario.ids.waiting}/tickets`,
    );
    expect(ok.status).toBe(200);
    expect(ok.body.fromConversation.map((ticket) => ticket.number)).toEqual(['INC-20311']);
    expect(ok.body.others.open.map((ticket) => ticket.number)).toEqual(['REQ-10442']);
    expect(ok.body.others.closed.map((ticket) => ticket.number)).toEqual(['INC-20150']);
    expect(app.tickets.listings.at(-1)).toEqual({ requesterId: BRUNO!.id, scope: 'all' });
  });

  it('esconde os chamados de conversa com o agent ou assumida por outro, como se não existisse', async () => {
    const before = app.tickets.listings.length;
    const missing = await scenario.rafael.json('GET', `${LIST}/${UNKNOWN_ID}/tickets`);
    const withAgent = await scenario.rafael.json('GET', `${LIST}/${scenario.ids.agent}/tickets`);
    const byOther = await scenario.gabriela.json('GET', `${LIST}/${scenario.ids.claimed}/tickets`);
    const own = await scenario.rafael.call('GET', `${LIST}/${scenario.ids.claimed}/tickets`);
    expect([withAgent.status, byOther.status, own.status]).toEqual([404, 404, 200]);
    expect(withAgent.body).toEqual(missing.body);
    expect(byOther.body).toEqual(missing.body);
    expect(app.tickets.listings).toHaveLength(before + 1);
  });

  it('responde 503 com código próprio quando o sistema de chamados está fora', async () => {
    vi.spyOn(app.tickets, 'listOwn').mockRejectedValue(new TicketsUnavailableError());
    const down = await scenario.rafael.json<{ error: { code: string } }>(
      'GET',
      `${LIST}/${scenario.ids.waiting}/tickets`,
    );
    vi.restoreAllMocks();
    expect([down.status, down.body.error.code]).toEqual([503, 'tickets_unavailable']);
  });

  it('bloqueia o funcionário em todas as rotas do console e exige sessão', async () => {
    const bruno = scenario.employees.bruno;
    const id = scenario.ids.waiting;
    const routes: [string, string][] = [
      ['GET', LIST],
      ['GET', `${LIST}/${id}`],
      ['GET', `${LIST}/${id}/tickets`],
      ['POST', `${LIST}/${id}/claim`],
      ['POST', `${LIST}/${id}/messages`],
      ['POST', `${LIST}/${id}/read`],
    ];
    const blocked = await Promise.all(routes.map(([method, path]) => bruno.call(method, path)));
    const anonymous = await bruno.call('GET', LIST, { cookie: '' });
    expect(blocked.map((response) => response.status)).toEqual(routes.map(() => 403));
    expect(anonymous.status).toBe(401);
  });
});
