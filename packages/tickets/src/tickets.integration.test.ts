import {
  CHAT_CONVERSATION_HANDED_OFF,
  DEMO_PEOPLE,
  TicketNotFoundError,
  type DemoPerson,
  type PriorityFacts,
  type TicketDetail,
  type TicketDraft,
  type TicketSummary,
} from '@nexo/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startTicketsHarness, type TicketsHarness } from './test-harness/tickets-harness.js';

const CONVERSATION_ID = '0b8f6c1e-4a3d-4e7b-9c52-6d1a2f3e4b58';

function personNamed(name: string): DemoPerson {
  const person = DEMO_PEOPLE.find((candidate) => candidate.name === name);
  if (person === undefined) {
    throw new Error(`Pessoa de exemplo não encontrada: ${name}`);
  }
  return person;
}

const ANA = personNamed('Ana Souza');
const CARLA = personNamed('Carla Mendes');
const RAFAEL = personNamed('Rafael Lima');

describe('leitura HTTP e seed dos chamados', () => {
  let harness: TicketsHarness;

  beforeAll(async () => {
    harness = await startTicketsHarness('off');
  });

  afterAll(() => harness.close());

  it('TI-19: carrega os chamados da Ana com o INC-20311 vencido e o INC-20150 reabrível', async () => {
    const response = await harness.get('/tickets', ANA);
    const tickets = (await response.json()) as TicketSummary[];
    const numbers = tickets.map((ticket) => ticket.number).sort();
    expect(numbers).toEqual(
      ['INC-19410', 'INC-19877', 'INC-20150', 'INC-20298', 'INC-20311', 'REQ-10442'].sort(),
    );
    expect(tickets.find((ticket) => ticket.number === 'INC-20311')?.overdue).toBe(true);
    const duplicates = await harness.tickets.findDuplicates({
      requesterId: ANA.id,
      category: 'access',
      text: 'a senha do SAP bloqueou de novo',
    });
    expect(duplicates.reopenable.map((ticket) => ticket.number)).toContain('INC-20150');
  });

  it('filtra a listagem pelo escopo', async () => {
    const open = (await (await harness.get('/tickets?scope=open', ANA)).json()) as TicketSummary[];
    const closed = (await (
      await harness.get('/tickets?scope=closed', ANA)
    ).json()) as TicketSummary[];
    expect(open.map((ticket) => ticket.status)).not.toContain('resolved');
    expect(closed.map((ticket) => ticket.status)).toEqual(['resolved', 'resolved', 'resolved']);
  });

  it('devolve o detalhe do próprio chamado com o último evento do histórico', async () => {
    const response = await harness.get('/tickets/INC-20311', ANA);
    const ticket = (await response.json()) as TicketDetail;
    expect(response.status).toBe(200);
    expect(ticket.latestEvent?.label).toBe('Aguardando analista');
    expect(ticket.description).toContain('Lentidão geral');
  });

  it('TI-02: responde igual para chamado de outro funcionário e chamado inexistente', async () => {
    const foreign = await harness.get('/tickets/INC-20517', ANA);
    const missing = await harness.get('/tickets/INC-99999', ANA);
    expect(foreign.status).toBe(404);
    expect(foreign.status).toBe(missing.status);
    expect(await foreign.json()).toEqual(await missing.json());
  });

  it('recusa sessão ausente e papel de analista', async () => {
    expect((await harness.get('/tickets')).status).toBe(401);
    expect((await harness.get('/tickets', RAFAEL)).status).toBe(403);
  });

  it('recusa escopo e número inválidos', async () => {
    expect((await harness.get('/tickets?scope=tudo', ANA)).status).toBe(400);
    expect((await harness.get('/tickets/abc', ANA)).status).toBe(400);
  });

  it('TI-03: não lista, consulta, busca, complementa, reabre nem deduplica chamados alheios', async () => {
    const { tickets } = harness;
    const listed = await tickets.listOwn({ requesterId: ANA.id, scope: 'all' });
    expect(listed.map((ticket) => ticket.number)).not.toContain('INC-20517');
    expect(await tickets.findOwn({ requesterId: ANA.id, number: 'INC-20517' })).toBeNull();
    const found = await tickets.searchOwn({ requesterId: ANA.id, query: 'filial' });
    expect(found).toEqual([]);
    await expect(
      tickets.complement({
        requesterId: ANA.id,
        idempotencyKey: 'ti03-complement',
        number: 'INC-20517',
        text: 'mais detalhes',
      }),
    ).rejects.toBeInstanceOf(TicketNotFoundError);
    await expect(
      tickets.reopen({
        requesterId: ANA.id,
        idempotencyKey: 'ti03-reopen',
        number: 'INC-20402',
        reason: 'voltou a falhar',
      }),
    ).rejects.toBeInstanceOf(TicketNotFoundError);
    const duplicates = await tickets.findDuplicates({
      requesterId: ANA.id,
      category: 'network_vpn',
      text: 'VPN sem acesso à rede da filial',
    });
    expect(duplicates.openMatches.map((ticket) => ticket.number)).not.toContain('INC-20517');
  });

  it('busca os próprios chamados pelo texto, ignorando acentos', async () => {
    const found = await harness.tickets.searchOwn({ requesterId: ANA.id, query: 'lentidao' });
    expect(found.map((ticket) => ticket.number)).toEqual(['INC-20311']);
  });

  it('cria chamados com numeração sequencial e idempotência persistidas', async () => {
    const draft = await draftFor(harness);
    const first = await harness.tickets.create({
      requesterId: ANA.id,
      idempotencyKey: 'k1',
      draft,
    });
    const repeated = await harness.tickets.create({
      requesterId: ANA.id,
      idempotencyKey: 'k1',
      draft,
    });
    const second = await harness.tickets.create({
      requesterId: ANA.id,
      idempotencyKey: 'k2',
      draft,
    });
    expect(first.number).toBe('INC-20520');
    expect(repeated.number).toBe(first.number);
    expect(second.number).toBe('INC-20521');
    const detail = await harness.get(`/tickets/${first.number}`, ANA);
    expect(((await detail.json()) as TicketDetail).latestEvent?.kind).toBe('created');
  });

  it('registra a transferência no histórico dos chamados citados', async () => {
    await harness.publisher.publish({
      name: CHAT_CONVERSATION_HANDED_OFF,
      occurredAt: new Date().toISOString(),
      payload: handoffOf(ANA.id, 'INC-20311'),
    });
    const ticket = await harness.tickets.findOwn({ requesterId: ANA.id, number: 'INC-20311' });
    expect(ticket?.latestEvent?.kind).toBe('handed_off');
    const untouched = await harness.tickets.findOwn({ requesterId: ANA.id, number: 'INC-20298' });
    expect(untouched?.latestEvent?.kind).toBe('status_changed');
  });

  it('ignora chamado citado que pertence a outro solicitante', async () => {
    await harness.publisher.publish({
      name: CHAT_CONVERSATION_HANDED_OFF,
      occurredAt: new Date().toISOString(),
      payload: handoffOf(ANA.id, 'INC-20517'),
    });
    const foreign = await harness.tickets.findOwn({ requesterId: CARLA.id, number: 'INC-20517' });
    expect(foreign?.latestEvent?.kind).toBe('created');
  });
});

describe('legado indisponível', () => {
  let harness: TicketsHarness;

  beforeAll(async () => {
    harness = await startTicketsHarness('forced');
  });

  afterAll(() => harness.close());

  it('responde 503 tickets_unavailable na leitura HTTP', async () => {
    const response = await harness.get('/tickets', ANA);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'tickets_unavailable' } });
  });

  it('não propaga a falha do legado ao publicar a transferência', async () => {
    await expect(
      harness.publisher.publish({
        name: CHAT_CONVERSATION_HANDED_OFF,
        occurredAt: new Date().toISOString(),
        payload: handoffOf(ANA.id, 'INC-20311'),
      }),
    ).resolves.toBeUndefined();
    expect(harness.loggedErrors).toHaveLength(1);
  });
});

function handoffOf(requesterId: string, ...ticketNumbers: string[]) {
  return {
    conversationId: CONVERSATION_ID,
    requesterId,
    reason: 'requested' as const,
    level: 'N1' as const,
    ticketNumbers,
  };
}

async function draftFor(harness: TicketsHarness): Promise<TicketDraft> {
  const priorityFacts: PriorityFacts = {
    impact: 'only_me',
    blocksWork: false,
    sameDayCommitment: false,
    hasWorkaround: true,
    kind: 'incident',
  };
  const assessment = await harness.tickets.assessPriority(priorityFacts);
  return {
    title: 'Teclado sem resposta',
    description: 'O teclado do notebook parou de responder',
    type: 'incident',
    category: 'hardware',
    affected: 'only_me',
    priorityFacts,
    priority: assessment.priority,
    dueAt: assessment.dueAt,
    rule: assessment.rule,
  };
}
