import type { AgentTurnEvent, ChatMessage, ChatStreamEvent } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { collectEvents, completedEvent, eventNames } from '../testing/agent-events.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { makeDraft } from '../testing/factories.js';
import { ANA, BRUNO } from '../testing/people.js';
import { makeTurnFixture, type TurnFixture } from '../testing/turn-fixture.js';
import { RetryEmployeeTurn } from './retry-employee-turn.js';
import { SendEmployeeMessage, type SendEmployeeMessageInput } from './send-employee-message.js';

const SESSION = { userId: ANA.id, userName: ANA.name, sessionId: 'sessao-ana' };
const BRUNO_SESSION = { userId: BRUNO.id, userName: BRUNO.name, sessionId: 'sessao-bruno' };
const CLIENT_MESSAGE_ID = '0b7f3c2e-6d1a-4e8b-9c5f-2a4d6e8f0a1b';
const PROPOSAL: AgentTurnEvent = {
  type: 'proposal',
  kind: 'create_ticket',
  draft: makeDraft(),
  targetNumber: null,
  complement: null,
};

function makeInput(text: string, overrides: Partial<SendEmployeeMessageInput> = {}) {
  const signal = new AbortController().signal;
  const base = { clientMessageId: null, quickReply: null, ticketSelection: null };
  return { ...base, session: SESSION, text, signal, ...overrides };
}

async function send(
  fixture: TurnFixture,
  text: string,
  overrides: Partial<SendEmployeeMessageInput> = {},
): Promise<ChatStreamEvent[]> {
  const sut = new SendEmployeeMessage(fixture.turnDeps);
  return collectEvents(await sut.execute(makeInput(text, overrides)));
}

function startedReplyId(events: readonly ChatStreamEvent[]): string {
  const started = events.find((event) => event.event === 'turn.started');
  if (started?.event !== 'turn.started') {
    throw new Error('turn.started esperado');
  }
  return started.data.replyId;
}

function completedMessage(events: readonly ChatStreamEvent[]): ChatMessage {
  const completed = events.at(-1);
  if (completed?.event !== 'turn.completed') {
    throw new Error('turn.completed esperado');
  }
  return completed.data.message;
}

async function agentMessages(fixture: TurnFixture, conversationId: string) {
  const recent = await fixture.messages.listRecent({ conversationId, limit: 20 });
  return recent.filter((message) => message.author === 'agent');
}

async function proposeTicket(fixture: TurnFixture): Promise<void> {
  fixture.agent.enqueue([PROPOSAL, completedEvent('Confira:')]);
  await send(fixture, 'Minha VPN não conecta');
}

describe('SendEmployeeMessage: id da mensagem do funcionário', () => {
  it('grava e ecoa a mensagem com o id gerado pelo cliente', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([completedEvent('Oi')]);
    const [accepted] = await send(fixture, 'Oi', { clientMessageId: CLIENT_MESSAGE_ID });
    expect(accepted).toMatchObject({
      event: 'message.accepted',
      data: { message: { id: CLIENT_MESSAGE_ID, author: 'employee' } },
    });
    expect(await fixture.messages.findById(CLIENT_MESSAGE_ID)).toMatchObject({ text: 'Oi' });
  });

  it('não inicia turno com o agent pausado e usa o id do cliente', async () => {
    const fixture = makeTurnFixture();
    await seedConversation(fixture, { state: 'with_analyst' });
    const events = await send(fixture, 'Oi', { clientMessageId: CLIENT_MESSAGE_ID });
    expect(eventNames(events)).toEqual(['message.accepted', 'turn.skipped']);
    expect(await fixture.messages.findById(CLIENT_MESSAGE_ID)).not.toBeNull();
  });

  it('recusa id repetido sem gravar, consumir uso nem manter a trava', async () => {
    const fixture = makeTurnFixture();
    const conversation = await seedConversation(fixture, { state: 'agent' });
    fixture.agent.enqueue([completedEvent('Oi')]);
    await send(fixture, 'Oi', { clientMessageId: CLIENT_MESSAGE_ID });
    const repeated = send(fixture, 'Outra', { clientMessageId: CLIENT_MESSAGE_ID });
    await expect(repeated).rejects.toMatchObject({ code: 'invalid_conversation_state' });
    const saved = await fixture.messages.listRecent({ conversationId: conversation.id, limit: 10 });
    expect(saved.map((message) => message.text)).toEqual(['Oi', 'Oi']);
    expect((await fixture.turnDeps.allowance.current(SESSION.sessionId)).messagesUsed).toBe(1);
    const current = await fixture.conversations.findById(conversation.id);
    expect(current?.props.turnLockUntil).toBeNull();
  });

  it('recusa o id de uma mensagem de outro funcionário sem sobrescrevê-la', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([completedEvent('Oi, Bruno')]);
    await send(fixture, 'Sou o Bruno', {
      session: BRUNO_SESSION,
      clientMessageId: CLIENT_MESSAGE_ID,
    });
    const stolen = send(fixture, 'Sou a Ana', { clientMessageId: CLIENT_MESSAGE_ID });
    await expect(stolen).rejects.toMatchObject({ code: 'invalid_conversation_state' });
    expect(await fixture.conversations.findActiveByEmployee(ANA.id)).toBeNull();
    expect((await fixture.turnDeps.allowance.current(SESSION.sessionId)).messagesUsed).toBe(0);
    expect(await fixture.messages.findById(CLIENT_MESSAGE_ID)).toMatchObject({
      text: 'Sou o Bruno',
    });
  });
});

describe('SendEmployeeMessage: id da resposta anunciado em turn.started', () => {
  it('anuncia o id logo depois da mensagem aceita e grava a resposta com ele', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([completedEvent('Você tem 1 chamado.')]);
    const events = await send(fixture, 'Qual o status do meu chamado?');
    expect(eventNames(events).slice(0, 2)).toEqual(['message.accepted', 'turn.started']);
    const replyId = startedReplyId(events);
    expect(completedMessage(events).id).toBe(replyId);
    expect(await fixture.messages.findById(replyId)).toMatchObject({ text: 'Você tem 1 chamado.' });
  });

  it('usa o mesmo id na mensagem de falha gravada e publicada', async () => {
    const fixture = makeTurnFixture();
    const conversation = await seedConversation(fixture, { state: 'agent' });
    const created: string[] = [];
    fixture.hub.forConversation(conversation.id).subscribe((change) => {
      if (change.event === 'message.created') {
        created.push(change.data.message.id);
      }
    });
    fixture.agent.enqueue([{ type: 'failed', code: 'agent_unavailable', retryable: true }]);
    const events = await send(fixture, 'Oi');
    const replyId = startedReplyId(events);
    expect(events.at(-1)?.event).toBe('turn.failed');
    expect(await fixture.messages.findById(replyId)).toMatchObject({ status: 'failed' });
    expect(created).toContain(replyId);
  });

  it('mantém o id na resposta que transfere para o analista', async () => {
    const fixture = makeTurnFixture();
    const conversation = await seedConversation(fixture, { state: 'agent' });
    fixture.agent.enqueue([
      { type: 'handoff-requested', reason: 'critical', summary: 'Rede parada.', confidence: 0.9 },
      completedEvent('Vou transferir você para um analista.'),
    ]);
    const events = await send(fixture, 'A rede caiu para todo mundo');
    const replyId = startedReplyId(events);
    expect(completedMessage(events)).toMatchObject({ id: replyId });
    const replies = await agentMessages(fixture, conversation.id);
    expect(replies.map((message) => message.id)).toEqual([replyId]);
  });

  it('usa o id na confirmação por texto', async () => {
    const fixture = makeTurnFixture();
    await proposeTicket(fixture);
    const events = await send(fixture, 'sim, pode abrir');
    const replyId = startedReplyId(events);
    expect(completedMessage(events)).toMatchObject({ id: replyId });
    expect((await fixture.messages.findById(replyId))?.parts[0]?.type).toBe('ticket_card');
  });

  it('usa o id no cancelamento por texto', async () => {
    const fixture = makeTurnFixture();
    await proposeTicket(fixture);
    const events = await send(fixture, 'não');
    const replyId = startedReplyId(events);
    expect(completedMessage(events)).toMatchObject({ id: replyId });
    expect(await fixture.messages.findById(replyId)).toMatchObject({
      text: 'Tudo bem, não abri o chamado.',
    });
  });

  it('começa a nova tentativa com turn.started e grava a resposta com esse id', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([{ type: 'failed', code: 'agent_unavailable', retryable: true }]);
    const failed = startedReplyId(await send(fixture, 'Oi'));
    fixture.agent.enqueue([completedEvent('Agora sim')]);
    const retry = new RetryEmployeeTurn(fixture.turnDeps);
    const signal = new AbortController().signal;
    const events = await collectEvents(await retry.execute({ session: SESSION, signal }));
    expect(events[0]?.event).toBe('turn.started');
    const replyId = startedReplyId(events);
    expect(replyId).not.toBe(failed);
    expect(completedMessage(events)).toMatchObject({ id: replyId, text: 'Agora sim' });
  });
});
