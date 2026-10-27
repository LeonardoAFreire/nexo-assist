import type { ChatMessage, ConsoleFilter } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeChatFixture, type ChatFixture } from '../testing/chat-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { ANA, BRUNO, GABRIELA, RAFAEL } from '../testing/people.js';
import { TimelineBuilder } from '../timeline/timeline-builder.js';
import { ConsoleDirectory } from './console-directory.js';
import { ConsoleQueries } from './console-queries.js';

const HOUR_MS = 3_600_000;

function makeQueries(fixture: ChatFixture): ConsoleQueries {
  const { conversations, messages, identity, clock, views } = fixture;
  const timeline = new TimelineBuilder(fixture.actions);
  const directory = new ConsoleDirectory({ conversations, messages, identity, clock });
  return new ConsoleQueries({ directory, conversations, messages, views, timeline });
}

async function seedConsole(fixture: ChatFixture): Promise<void> {
  await seedConversation(fixture, { state: 'agent', id: 'c-agent', employeeId: ANA.id });
  await seedConversation(fixture, {
    state: 'waiting_analyst',
    id: 'c-late',
    employeeId: BRUNO.id,
    handoff: { handedOffAt: '2026-10-26T13:10:00.000Z', ticketNumbers: ['INC-20311'] },
  });
  await seedConversation(fixture, {
    state: 'waiting_analyst',
    id: 'c-early',
    employeeId: ANA.id,
    handoff: {
      reason: 'low_confidence',
      confidence: 0.41,
      handedOffAt: '2026-10-26T13:00:00.000Z',
    },
  });
  await seedConversation(fixture, { state: 'with_analyst', id: 'c-mine', employeeId: BRUNO.id });
  await seedConversation(fixture, { state: 'closed', id: 'c-closed', employeeId: ANA.id });
}

async function listIds(queries: ConsoleQueries, filter: ConsoleFilter, q?: string) {
  const list = await queries.list({ viewerId: RAFAEL.id, filter, q });
  return list.items.map((item) => item.id);
}

describe('ConsoleQueries.list', () => {
  it('deriva "Agent pediu ajuda" com a confiança e "Transferida" com o chamado', async () => {
    const fixture = makeChatFixture();
    await seedConsole(fixture);
    const { items } = await makeQueries(fixture).list({ viewerId: RAFAEL.id, filter: 'all' });
    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get('c-early')).toMatchObject({
      consoleStatus: 'agent_asked_help',
      statusDetail: 'confiança 41%',
    });
    expect(byId.get('c-late')).toMatchObject({
      consoleStatus: 'transferred',
      statusDetail: 'INC-20311',
    });
    expect(byId.get('c-agent')?.consoleStatus).toBe('agent_attending');
    expect(byId.get('c-mine')?.consoleStatus).toBe('you_are_attending');
    expect(byId.get('c-closed')?.consoleStatus).toBe('resolved_by_agent');
  });

  it('mostra o tempo restante para contato e "atendida por" quando outro analista assumiu', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, {
      state: 'waiting_analyst',
      id: 'c-wait',
      handoff: {
        contactDueAt: new Date(Date.parse('2026-10-26T13:05:00.000Z') + HOUR_MS / 2).toISOString(),
      },
    });
    await seedConversation(fixture, { state: 'with_analyst', id: 'c-other', employeeId: BRUNO.id });
    const { items } = await makeQueries(fixture).list({ viewerId: GABRIELA.id, filter: 'all' });
    const byId = new Map(items.map((item) => [item.id, item]));
    expect(byId.get('c-wait')?.statusDetail).toBe('contato em 30 min');
    expect(byId.get('c-other')).toMatchObject({
      consoleStatus: 'attended_by_other',
      statusDetail: 'Rafael Lima',
    });
  });

  it('aplica os filtros e ordena aguardando atendente primeiro, da mais antiga', async () => {
    const fixture = makeChatFixture();
    await seedConsole(fixture);
    const queries = makeQueries(fixture);
    expect(await listIds(queries, 'for_you')).toEqual(['c-early', 'c-late']);
    expect(await listIds(queries, 'with_agent')).toEqual(['c-agent']);
    expect(await listIds(queries, 'mine')).toEqual(['c-mine']);
    const all = await listIds(queries, 'all');
    expect(all.slice(0, 2)).toEqual(['c-early', 'c-late']);
    expect(all).toHaveLength(5);
  });

  it('os contadores ignoram o filtro e respeitam a busca', async () => {
    const fixture = makeChatFixture();
    await seedConsole(fixture);
    const queries = makeQueries(fixture);
    const filtered = await queries.list({ viewerId: RAFAEL.id, filter: 'mine' });
    expect(filtered.counters).toEqual({ all: 5, for_you: 2, with_agent: 1, mine: 1 });
    const searched = await queries.list({ viewerId: RAFAEL.id, filter: 'mine', q: 'ana' });
    expect(searched.counters).toEqual({ all: 3, for_you: 1, with_agent: 1, mine: 0 });
    expect(searched.items).toEqual([]);
  });

  it('busca por nome sem acento e sem diferenciar maiúsculas, ou por número de chamado', async () => {
    const fixture = makeChatFixture();
    await seedConsole(fixture);
    const queries = makeQueries(fixture);
    expect(await listIds(queries, 'all', 'SOUZA')).toHaveLength(3);
    expect(await listIds(queries, 'all', 'tavarés')).toEqual(['c-late', 'c-mine']);
    expect(await listIds(queries, 'all', 'inc-20311')).toEqual(['c-late']);
    expect(await listIds(queries, 'all', 'zzz')).toEqual([]);
  });

  it('conta como não lidas as mensagens do funcionário depois da leitura do analista', async () => {
    const fixture = makeChatFixture();
    const conversation = await seedConversation(fixture, {
      state: 'waiting_analyst',
      id: 'c-unread',
    });
    const base: ChatMessage = {
      id: 'base',
      conversationId: 'c-unread',
      authorName: null,
      authorLevel: null,
      parts: [],
      turn: null,
      status: 'complete',
      author: 'employee',
      text: '',
      createdAt: '',
    };
    await fixture.messages.save({
      ...base,
      id: 'u1',
      text: 'b',
      createdAt: '2026-10-26T13:01:00.000Z',
    });
    await fixture.messages.save({
      ...base,
      id: 'u2',
      text: 'a'.repeat(100),
      createdAt: '2026-10-26T13:03:00.000Z',
    });
    const queries = makeQueries(fixture);
    const before = await queries.itemUpdate({ viewerId: RAFAEL.id, conversationId: 'c-unread' });
    expect(before.item.unreadCount).toBe(2);
    expect(before.item.lastMessage.preview).toHaveLength(80);
    await fixture.conversations.save(
      conversation.withChanges({ analystReadAt: '2026-10-26T13:02:00.000Z' }),
    );
    const after = await queries.itemUpdate({ viewerId: RAFAEL.id, conversationId: 'c-unread' });
    expect(after.item.unreadCount).toBe(1);
  });
});

describe('ConsoleQueries.detail', () => {
  it('devolve a conversa e a linha do tempo, ou not_found', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'waiting_analyst', id: 'c-detail' });
    const queries = makeQueries(fixture);
    const detail = await queries.detail('c-detail');
    expect(detail.conversation).toMatchObject({ id: 'c-detail', state: 'waiting_analyst' });
    await expect(queries.detail('inexistente')).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      queries.itemUpdate({ viewerId: RAFAEL.id, conversationId: 'inexistente' }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });
});
