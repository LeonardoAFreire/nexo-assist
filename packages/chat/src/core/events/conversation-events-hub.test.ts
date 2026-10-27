import { describe, expect, it } from 'vitest';
import { ConversationEventsHub, type ConversationChange } from './conversation-events-hub.js';

function makeChange(employeeId: string, conversationId: string): ConversationChange {
  return {
    employeeId,
    conversationId,
    event: {
      event: 'message.created',
      data: {
        message: {
          id: 'm1',
          conversationId,
          author: 'employee',
          authorName: null,
          authorLevel: null,
          text: 'oi',
          parts: [],
          turn: null,
          status: 'complete',
          createdAt: '2026-10-26T13:05:00.000Z',
        },
      },
    },
  };
}

describe('ConversationEventsHub', () => {
  it('entrega ao funcionário só os eventos das conversas dele', () => {
    const hub = new ConversationEventsHub();
    const received: string[] = [];
    hub.forEmployee('ana').subscribe((event) => received.push(event.event));
    hub.publish(makeChange('ana', 'c1'));
    hub.publish(makeChange('bruno', 'c2'));
    expect(received).toEqual(['message.created']);
  });

  it('entrega ao console todas as mudanças, ou só as da conversa aberta', () => {
    const hub = new ConversationEventsHub();
    const all: string[] = [];
    const opened: string[] = [];
    hub.forConsole().subscribe((change) => all.push(change.conversationId));
    hub.forConversation('c1').subscribe((event) => opened.push(event.event));
    hub.publish(makeChange('ana', 'c1'));
    hub.publish(makeChange('bruno', 'c2'));
    expect(all).toEqual(['c1', 'c2']);
    expect(opened).toEqual(['message.created']);
  });

  it('encerra os assinantes ao fechar', () => {
    const hub = new ConversationEventsHub();
    let completed = false;
    hub.forConsole().subscribe({ complete: () => (completed = true) });
    hub.close();
    expect(completed).toBe(true);
  });
});
