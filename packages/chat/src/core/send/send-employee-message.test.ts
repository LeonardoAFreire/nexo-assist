import type { AgentTurnEvent, ChatStreamEvent } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { collectEvents, completedEvent, eventNames, makeStep } from '../testing/agent-events.js';
import { makeTurnFixture, type TurnFixture } from '../testing/turn-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { makeDraft } from '../testing/factories.js';
import { ANA } from '../testing/people.js';
import { SendEmployeeMessage, type SendEmployeeMessageInput } from './send-employee-message.js';

const SESSION = { userId: ANA.id, userName: ANA.name, sessionId: 'sessao-1' };
const PROPOSAL: AgentTurnEvent = {
  type: 'proposal',
  kind: 'create_ticket',
  draft: makeDraft(),
  targetNumber: null,
  complement: null,
};

function makeInput(
  text: string,
  overrides: Partial<SendEmployeeMessageInput> = {},
): SendEmployeeMessageInput {
  const signal = new AbortController().signal;
  return { session: SESSION, text, quickReply: null, ticketSelection: null, signal, ...overrides };
}

async function send(
  fixture: TurnFixture,
  text: string,
  overrides: Partial<SendEmployeeMessageInput> = {},
): Promise<ChatStreamEvent[]> {
  const stream = await new SendEmployeeMessage(fixture.turnDeps).execute(
    makeInput(text, overrides),
  );
  return collectEvents(stream);
}

async function expectRuleError(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(ChatRuleError);
  await expect(promise).rejects.toMatchObject({ code });
}

async function activeConversation(fixture: TurnFixture) {
  const conversation = await fixture.conversations.findActiveByEmployee(ANA.id);
  if (conversation === null) {
    throw new Error('Conversa ativa esperada');
  }
  return conversation;
}

describe('SendEmployeeMessage: turno com o agent', () => {
  it('abre a conversa, chama o agent com a sessão e grava a resposta com o turno', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([
      { type: 'step', step: makeStep() },
      completedEvent('Você tem 1 chamado.'),
    ]);
    const events = await send(fixture, 'Qual o status do meu chamado?');
    expect(eventNames(events)).toEqual(['message.accepted', 'turn.step', 'turn.completed']);
    expect(fixture.agent.inputs[0]).toMatchObject({
      requester: { id: ANA.id, name: ANA.name },
      userMessage: 'Qual o status do meu chamado?',
      pendingAction: null,
    });
    const conversation = await activeConversation(fixture);
    const saved = await fixture.messages.listRecent({ conversationId: conversation.id, limit: 10 });
    expect(saved.map((message) => message.author)).toEqual(['employee', 'agent']);
    expect(saved[1]?.turn?.steps).toHaveLength(1);
    expect(conversation.props.turnLockUntil).toBeNull();
  });

  it('informa o uso da sessão na mensagem aceita', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([completedEvent('Oi')]);
    const [accepted] = await send(fixture, 'Oi');
    expect(accepted).toMatchObject({
      event: 'message.accepted',
      data: { usage: { messagesUsed: 1, messagesLimit: 30 } },
    });
  });

  it('transforma uma proposta em ação pendente exibida como parte da resposta', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([PROPOSAL, completedEvent('Confira antes de eu criar:')]);
    const events = await send(fixture, 'Minha VPN não conecta');
    const conversation = await activeConversation(fixture);
    const pending = await fixture.actions.findPendingByConversation(conversation.id);
    expect(pending?.kind).toBe('create_ticket');
    const completed = events.at(-1);
    expect(completed).toMatchObject({
      event: 'turn.completed',
      data: { conversation: { pendingAction: { id: pending?.id } } },
    });
    expect(eventNames(events)).toContain('turn.part');
  });

  it('transfere quando o agent pede, preenche a decisão e publica o evento', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([
      {
        type: 'handoff-requested',
        reason: 'critical',
        summary: 'Rede parada no financeiro, veja o INC-20311.',
        confidence: 0.9,
      },
      completedEvent('Vou transferir você para um analista.'),
    ]);
    const events = await send(fixture, 'A rede caiu para todo mundo');
    const completed = events.at(-1);
    expect(completed).toMatchObject({
      event: 'turn.completed',
      data: {
        conversation: { state: 'waiting_analyst', handoff: { level: 'N2', reason: 'critical' } },
        message: { turn: { decision: { handoff: { level: 'N2' } } } },
      },
    });
    expect(fixture.events.published).toHaveLength(1);
    expect(fixture.events.published[0]?.payload).toMatchObject({
      requesterId: ANA.id,
      level: 'N2',
      ticketNumbers: ['INC-20311'],
    });
  });

  it('falha o turno com turn.failed retryable quando o agent fica indisponível', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([{ type: 'failed', code: 'agent_unavailable', retryable: true }]);
    const events = await send(fixture, 'Oi');
    expect(events.at(-1)).toMatchObject({
      event: 'turn.failed',
      data: { error: { code: 'agent_unavailable' }, retryable: true },
    });
    const conversation = await activeConversation(fixture);
    const saved = await fixture.messages.listRecent({ conversationId: conversation.id, limit: 10 });
    expect(saved.at(-1)).toMatchObject({ author: 'agent', status: 'failed' });
    expect(conversation.props.turnLockUntil).toBeNull();
  });

  it('trata erro inesperado do agent como falha do turno', async () => {
    const fixture = makeTurnFixture();
    const events = await send(fixture, 'Oi');
    expect(events.at(-1)).toMatchObject({ event: 'turn.failed', data: { retryable: true } });
  });

  it('trata cancelamento da conexão como falha do turno', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([completedEvent('Oi')]);
    const controller = new AbortController();
    controller.abort();
    const events = await send(fixture, 'Oi', { signal: controller.signal });
    expect(eventNames(events)).toEqual(['message.accepted', 'turn.failed']);
  });
});

describe('SendEmployeeMessage: regras de entrada', () => {
  it('recusa um turno concorrente com turn_in_progress e libera depois do primeiro', async () => {
    const fixture = makeTurnFixture();
    const sut = new SendEmployeeMessage(fixture.turnDeps);
    fixture.agent.enqueue([completedEvent('Oi')]);
    const first = await sut.execute(makeInput('Primeira'));
    await expectRuleError(sut.execute(makeInput('Segunda')), 'turn_in_progress');
    await collectEvents(first);
    fixture.agent.enqueue([completedEvent('Oi de novo')]);
    const events = await collectEvents(await sut.execute(makeInput('Terceira')));
    expect(eventNames(events)).toContain('turn.completed');
  });

  it('recusa a mensagem acima do limite sem criar conversa nem chamar o agent', async () => {
    const fixture = makeTurnFixture();
    for (let used = 0; used < 30; used += 1) {
      await fixture.turnDeps.allowance.consume(SESSION);
    }
    await expectRuleError(send(fixture, 'Mais uma'), 'message_limit_reached');
    expect(await fixture.conversations.findActiveByEmployee(ANA.id)).toBeNull();
    expect(fixture.agent.inputs).toHaveLength(0);
  });

  it('libera a trava quando o limite é atingido numa conversa existente', async () => {
    const fixture = makeTurnFixture();
    await seedConversation(fixture, { state: 'agent' });
    for (let used = 0; used < 30; used += 1) {
      await fixture.turnDeps.allowance.consume(SESSION);
    }
    await expectRuleError(send(fixture, 'Mais uma'), 'message_limit_reached');
    expect((await activeConversation(fixture)).props.turnLockUntil).toBeNull();
  });

  it('abre uma nova conversa depois que a anterior foi encerrada', async () => {
    const fixture = makeTurnFixture();
    const closed = await seedConversation(fixture, { state: 'closed' });
    fixture.agent.enqueue([completedEvent('Olá de novo')]);
    await send(fixture, 'Oi');
    expect((await activeConversation(fixture)).id).not.toBe(closed.id);
  });
});
