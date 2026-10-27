import { type TicketSummary, ticketSummarySchema } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { makeChatFixture, type ChatFixture } from '../testing/chat-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { CONVERSATION_ID, EMPLOYEE_ID, makeTicket } from '../testing/factories.js';
import { FakeTicketsReader } from '../testing/fake-tickets-reader.js';
import { ANA, GABRIELA, RAFAEL } from '../testing/people.js';
import { AnalystTicketAccess } from './analyst-ticket-access.js';

function summary(number: string, status: TicketSummary['status']): TicketSummary {
  return ticketSummarySchema.parse(makeTicket({ number, status }));
}

function makeAccess(fixture: ChatFixture) {
  const reader = new FakeTicketsReader({
    [EMPLOYEE_ID]: [
      summary('INC-20311', 'open'),
      summary('INC-20150', 'resolved'),
      summary('REQ-10442', 'in_progress'),
    ],
  });
  const access = new AnalystTicketAccess(fixture.conversations, fixture.messages, reader);
  return { access, reader };
}

describe('AnalystTicketAccess', () => {
  it('lista com o requesterId do dono da conversa, separando citados, abertos e encerrados', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, {
      state: 'waiting_analyst',
      handoff: { ticketNumbers: ['INC-20311'] },
    });
    const { access, reader } = makeAccess(fixture);
    const result = await access.listFor({ analyst: RAFAEL, conversationId: CONVERSATION_ID });
    expect(reader.requests).toEqual([{ requesterId: ANA.id, scope: 'all' }]);
    expect(result.fromConversation.map((ticket) => ticket.number)).toEqual(['INC-20311']);
    expect(result.others.open.map((ticket) => ticket.number)).toEqual(['REQ-10442']);
    expect(result.others.closed.map((ticket) => ticket.number)).toEqual(['INC-20150']);
  });

  it('permite ao analista que assumiu e nega a outro analista com not_found', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'with_analyst' });
    const { access, reader } = makeAccess(fixture);
    await expect(
      access.listFor({ analyst: RAFAEL, conversationId: CONVERSATION_ID }),
    ).resolves.toBeDefined();
    await expect(
      access.listFor({ analyst: GABRIELA, conversationId: CONVERSATION_ID }),
    ).rejects.toMatchObject({ code: 'not_found' });
    expect(reader.requests).toHaveLength(1);
  });

  it('nega conversa com o agent, encerrada ou inexistente sem consultar o legado', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'agent', id: 'c-agent' });
    await seedConversation(fixture, { state: 'closed', id: 'c-closed' });
    const { access, reader } = makeAccess(fixture);
    for (const conversationId of ['c-agent', 'c-closed', 'inexistente']) {
      await expect(access.listFor({ analyst: RAFAEL, conversationId })).rejects.toMatchObject({
        code: 'not_found',
      });
    }
    expect(reader.requests).toHaveLength(0);
  });

  it('nega a quem não tem papel de analista', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'waiting_analyst' });
    const { access, reader } = makeAccess(fixture);
    await expect(
      access.listFor({ analyst: ANA, conversationId: CONVERSATION_ID }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(reader.requests).toHaveLength(0);
  });
});
