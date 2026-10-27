import { TicketsUnavailableError } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { makeDecision, makeStep } from '../testing/agent-events.js';
import { makeChatFixture } from '../testing/chat-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { CONVERSATION_ID, EMPLOYEE_ID, makeTicket } from '../testing/factories.js';
import { RequestHandoff } from './request-handoff.js';

describe('HandOffConversation', () => {
  it('muda o estado, grava a mensagem de sistema com nível e prazo e publica o evento', async () => {
    const fixture = makeChatFixture();
    const conversation = await seedConversation(fixture, { state: 'agent' });
    const handedOff = await fixture.handOff.execute({
      conversation,
      reason: 'overdue',
      summary: 'Ana quer andamento do INC-20311.',
      confidence: 0.9,
      ticketNumbers: ['INC-20311'],
    });
    expect(handedOff.state).toBe('waiting_analyst');
    expect(handedOff.props.handoff).toMatchObject({ level: 'N2', confidence: 0.9 });
    const [system] = await fixture.messages.listRecent({
      conversationId: CONVERSATION_ID,
      limit: 5,
    });
    expect(system?.text).toContain('suporte N2');
    expect(fixture.events.published[0]).toMatchObject({
      name: 'chat.conversation.handed-off',
      payload: {
        requesterId: EMPLOYEE_ID,
        level: 'N2',
        reason: 'overdue',
        ticketNumbers: ['INC-20311'],
      },
    });
  });

  it('usa um prazo de contato de reserva quando o legado está fora do ar', async () => {
    const fixture = makeChatFixture();
    fixture.tickets.contactDeadline = () => Promise.reject(new TicketsUnavailableError());
    const conversation = await seedConversation(fixture, { state: 'agent' });
    const handedOff = await fixture.handOff.execute({
      conversation,
      reason: 'failure',
      summary: 'Falha repetida',
      confidence: null,
      ticketNumbers: [],
    });
    const handoff = handedOff.props.handoff;
    expect(handoff?.level).toBe('N1');
    expect(Date.parse(handoff?.contactDueAt ?? '')).toBeGreaterThan(
      Date.parse(handoff?.handedOffAt ?? ''),
    );
  });

  it('recusa transferir uma conversa que já está com analista ou aguardando', async () => {
    const fixture = makeChatFixture();
    const conversation = await seedConversation(fixture, { state: 'waiting_analyst' });
    const attempt = fixture.handOff.execute({
      conversation,
      reason: 'requested',
      summary: '',
      confidence: null,
      ticketNumbers: [],
    });
    await expect(attempt).rejects.toMatchObject({ code: 'invalid_conversation_state' });
    expect(fixture.events.published).toHaveLength(0);
  });
});

describe('RequestHandoff (botão)', () => {
  it('monta o resumo pelo código a partir das decisões e dos chamados citados', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'agent' });
    const decision = makeDecision({ confidence: { value: 0.72, label: 'média' } });
    const ticket = makeTicket({ number: 'INC-20311' });
    await fixture.messages.save({
      id: 'm1',
      conversationId: CONVERSATION_ID,
      author: 'employee',
      authorName: 'Ana Souza',
      authorLevel: null,
      text: 'Meu chamado está parado há 5 dias',
      parts: [],
      turn: null,
      status: 'complete',
      createdAt: '2026-10-26T13:00:00.000Z',
    });
    await fixture.messages.save({
      id: 'm2',
      conversationId: CONVERSATION_ID,
      author: 'agent',
      authorName: null,
      authorLevel: null,
      text: 'Veja o chamado',
      parts: [{ type: 'ticket_card', ticket }],
      turn: { steps: [makeStep()], decision },
      status: 'complete',
      createdAt: '2026-10-26T13:01:00.000Z',
    });
    const sut = new RequestHandoff(fixture.conversations, fixture.messages, fixture.handOff);
    const handedOff = await sut.execute({ employeeId: EMPLOYEE_ID });
    expect(handedOff.props.handoff).toMatchObject({
      reason: 'requested',
      level: 'N1',
      confidence: 0.72,
      ticketNumbers: ['INC-20311'],
    });
    const summary = handedOff.props.handoff?.summary ?? '';
    expect(summary).toContain('Meu chamado está parado há 5 dias');
    expect(summary).toContain('consultou seus chamados');
  });

  it('responde not_found sem conversa ativa e invalid_conversation_state se já transferida', async () => {
    const fixture = makeChatFixture();
    const sut = new RequestHandoff(fixture.conversations, fixture.messages, fixture.handOff);
    await expect(sut.execute({ employeeId: EMPLOYEE_ID })).rejects.toMatchObject({
      code: 'not_found',
    });
    await seedConversation(fixture, { state: 'waiting_analyst' });
    await expect(sut.execute({ employeeId: EMPLOYEE_ID })).rejects.toBeInstanceOf(ChatRuleError);
  });
});
