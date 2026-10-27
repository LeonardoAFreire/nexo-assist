import type { AgentTurnEvent, ChatStreamEvent, MessagePart, QuickOption } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { SendAnalystMessage } from '../analyst/send-analyst-message.js';
import { ReleaseConversation } from '../analyst/release-conversation.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { collectEvents, completedEvent, eventNames } from '../testing/agent-events.js';
import { makeTurnFixture, type TurnFixture } from '../testing/turn-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { makeDraft, makeTicket } from '../testing/factories.js';
import { ANA, RAFAEL } from '../testing/people.js';
import { RetryEmployeeTurn } from './retry-employee-turn.js';
import { SendEmployeeMessage, type SendEmployeeMessageInput } from './send-employee-message.js';

const SESSION = { userId: ANA.id, userName: ANA.name, sessionId: 'sessao-1' };
const OPTIONS: QuickOption[] = [
  { id: 'only_me', label: 'Só eu' },
  { id: 'my_team', label: 'Minha equipe' },
];
const PROPOSAL: AgentTurnEvent = {
  type: 'proposal',
  kind: 'create_ticket',
  draft: makeDraft(),
  targetNumber: null,
  complement: null,
};

function makeInput(text: string, overrides: Partial<SendEmployeeMessageInput> = {}) {
  const signal = new AbortController().signal;
  return { session: SESSION, text, quickReply: null, ticketSelection: null, signal, ...overrides };
}

async function send(
  fixture: TurnFixture,
  text: string,
  overrides: Partial<SendEmployeeMessageInput> = {},
): Promise<ChatStreamEvent[]> {
  const sut = new SendEmployeeMessage(fixture.turnDeps);
  return collectEvents(await sut.execute(makeInput(text, overrides)));
}

async function lastAgentMessage(fixture: TurnFixture) {
  const conversation = await fixture.conversations.findActiveByEmployee(ANA.id);
  const recent = await fixture.messages.listRecent({
    conversationId: conversation?.id ?? '',
    limit: 20,
  });
  return [...recent].reverse().find((message) => message.author === 'agent');
}

describe('SendEmployeeMessage: confirmação e cancelamento por texto', () => {
  it('confirma a ação pendente com "sim" sem chamar o agent', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([PROPOSAL, completedEvent('Confira:')]);
    await send(fixture, 'Minha VPN não conecta');
    const events = await send(fixture, 'sim, pode abrir');
    expect(fixture.agent.inputs).toHaveLength(1);
    expect(fixture.tickets.writes).toHaveLength(1);
    expect(eventNames(events)).toEqual(['message.accepted', 'turn.step', 'turn.completed']);
    expect((await lastAgentMessage(fixture))?.parts[0]?.type).toBe('ticket_card');
    const conversation = await fixture.conversations.findActiveByEmployee(ANA.id);
    expect(await fixture.actions.findPendingByConversation(conversation?.id ?? '')).toBeNull();
  });

  it('cancela a ação pendente com "não" sem chamar o agent nem escrever no legado', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([PROPOSAL, completedEvent('Confira:')]);
    await send(fixture, 'Minha VPN não conecta');
    const events = await send(fixture, 'não');
    expect(fixture.agent.inputs).toHaveLength(1);
    expect(fixture.tickets.writes).toHaveLength(0);
    expect(events.at(-1)).toMatchObject({
      event: 'turn.completed',
      data: { message: { text: 'Tudo bem, não abri o chamado.' } },
    });
  });

  it('envia "sim" ao agent quando não há ação pendente', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([completedEvent('Sim o quê?')]);
    await send(fixture, 'sim');
    expect(fixture.agent.inputs[0]?.userMessage).toBe('sim');
  });

  it('falha o turno com tickets_unavailable e mantém a ação pendente', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([PROPOSAL, completedEvent('Confira:')]);
    await send(fixture, 'Minha VPN não conecta');
    fixture.tickets.failures.push(new Error('timeout'), new Error('timeout'), new Error('timeout'));
    const events = await send(fixture, 'sim');
    expect(events.at(-1)).toMatchObject({
      event: 'turn.failed',
      data: { error: { code: 'tickets_unavailable' }, retryable: true },
    });
    const conversation = await fixture.conversations.findActiveByEmployee(ANA.id);
    expect(await fixture.actions.findPendingByConversation(conversation?.id ?? '')).not.toBeNull();
  });
});

describe('SendEmployeeMessage: agent pausado', () => {
  it.each(['waiting_analyst', 'with_analyst'] as const)(
    'entrega a mensagem ao console e termina com turn.skipped em %s',
    async (state) => {
      const fixture = makeTurnFixture();
      const conversation = await seedConversation(fixture, { state });
      const observed: string[] = [];
      fixture.hub.forConversation(conversation.id).subscribe((e) => observed.push(e.event));
      const events = await send(fixture, 'Posso sim, está ligado.');
      expect(eventNames(events)).toEqual(['message.accepted', 'turn.skipped']);
      expect(events[1]).toMatchObject({ data: { reason: state } });
      expect(fixture.agent.inputs).toHaveLength(0);
      expect(observed).toContain('message.created');
      const saved = await fixture.messages.listRecent({
        conversationId: conversation.id,
        limit: 5,
      });
      expect(saved.map((message) => message.text)).toEqual(['Posso sim, está ligado.']);
    },
  );
});

describe('SendEmployeeMessage: opções rápidas e seleção de chamado', () => {
  it('converte o dígito na opção aberta e marca a pergunta como respondida', async () => {
    const fixture = makeTurnFixture();
    const question = {
      type: 'quick_options',
      question: 'Quem?',
      options: OPTIONS,
      answered: false,
    } as const;
    fixture.agent.enqueue([{ type: 'part', part: question }, completedEvent('Quem é afetado?')]);
    await send(fixture, 'Minha VPN não conecta');
    const asked = await lastAgentMessage(fixture);
    fixture.agent.enqueue([completedEvent('Entendi')]);
    await send(fixture, '2');
    expect(fixture.agent.inputs[1]?.userMessage).toBe('Minha equipe');
    const answered = await fixture.messages.findById(asked?.id ?? '');
    expect(answered?.parts[0]).toMatchObject({ type: 'quick_options', answered: true });
  });

  it('aceita a opção escolhida pelo id e recusa opção inexistente', async () => {
    const fixture = makeTurnFixture();
    const question = {
      type: 'quick_options',
      question: 'Quem?',
      options: OPTIONS,
      answered: false,
    } as const;
    fixture.agent.enqueue([{ type: 'part', part: question }, completedEvent('Quem é afetado?')]);
    await send(fixture, 'Minha VPN não conecta');
    const messageId = (await lastAgentMessage(fixture))?.id ?? '';
    const invalid = send(fixture, 'x', { quickReply: { messageId, optionId: 'nenhuma' } });
    await expect(invalid).rejects.toBeInstanceOf(ChatRuleError);
    fixture.agent.enqueue([completedEvent('Entendi')]);
    await send(fixture, 'Só eu', { quickReply: { messageId, optionId: 'only_me' } });
    expect(fixture.agent.inputs[1]?.userMessage).toBe('Só eu');
  });

  it('inclui o número do chamado escolhido na seleção', async () => {
    const fixture = makeTurnFixture();
    const summary = { ...makeTicket(), latestEvent: null, overdue: false };
    const selection: MessagePart = {
      type: 'ticket_selection',
      tickets: [summary],
      selectedNumber: null,
    };
    fixture.agent.enqueue([{ type: 'part', part: selection }, completedEvent('Qual deles?')]);
    await send(fixture, 'Qual o status do meu chamado?');
    const messageId = (await lastAgentMessage(fixture))?.id ?? '';
    fixture.agent.enqueue([completedEvent('Aqui está')]);
    await send(fixture, 'Esse aqui', { ticketSelection: { messageId, number: 'INC-20519' } });
    expect(fixture.agent.inputs[1]?.userMessage).toBe('Esse aqui (INC-20519)');
    const refused = send(fixture, 'Outro', { ticketSelection: { messageId, number: 'INC-20311' } });
    await expect(refused).rejects.toBeInstanceOf(ChatRuleError);
  });
});

describe('SendEmployeeMessage: contexto do agent e nova tentativa', () => {
  it('rotula as mensagens do analista no contexto depois que ele devolve a conversa', async () => {
    const fixture = makeTurnFixture();
    const conversation = await seedConversation(fixture, { state: 'with_analyst' });
    const deps = fixture.analystDeps;
    await new SendAnalystMessage(deps).execute({
      analyst: RAFAEL,
      conversationId: conversation.id,
      text: 'Reinicie o notebook, por favor.',
    });
    await new ReleaseConversation(deps).execute({
      analyst: RAFAEL,
      conversationId: conversation.id,
    });
    fixture.agent.enqueue([completedEvent('Voltei')]);
    await send(fixture, 'Reiniciei, e agora?');
    const labels = fixture.agent.inputs[0]?.history.map((entry) => entry.authorLabel);
    expect(labels).toContain('Analista Rafael Lima (N2)');
  });

  it('refaz o turno que falhou sem contar outra mensagem', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([{ type: 'failed', code: 'agent_unavailable', retryable: true }]);
    await send(fixture, 'Oi');
    fixture.agent.enqueue([completedEvent('Agora sim')]);
    const retry = new RetryEmployeeTurn(fixture.turnDeps);
    const signal = new AbortController().signal;
    const events = await collectEvents(await retry.execute({ session: SESSION, signal }));
    expect(eventNames(events)).toEqual(['turn.completed']);
    expect(fixture.agent.inputs[1]?.userMessage).toBe('Oi');
    expect(events[0]).toMatchObject({ data: { usage: { messagesUsed: 1 } } });
  });

  it('recusa refazer quando a última resposta não falhou', async () => {
    const fixture = makeTurnFixture();
    fixture.agent.enqueue([completedEvent('Oi')]);
    await send(fixture, 'Oi');
    const retry = new RetryEmployeeTurn(fixture.turnDeps);
    const signal = new AbortController().signal;
    await expect(retry.execute({ session: SESSION, signal })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});
