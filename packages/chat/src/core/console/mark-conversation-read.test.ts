import { describe, expect, it } from 'vitest';
import { makeChatFixture } from '../testing/chat-fixture.js';
import { seedConversation } from '../testing/conversation-seeds.js';
import { CONVERSATION_ID } from '../testing/factories.js';
import { MarkConversationRead } from './mark-conversation-read.js';

describe('MarkConversationRead', () => {
  it('grava a leitura do analista e recusa conversa inexistente', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'waiting_analyst' });
    const sut = new MarkConversationRead(fixture.conversations, fixture.notifier, fixture.clock);
    await sut.execute(CONVERSATION_ID);
    const stored = await fixture.conversations.findById(CONVERSATION_ID);
    expect(stored?.props.analystReadAt).toBe('2026-10-26T13:05:00.000Z');
    await expect(sut.execute('inexistente')).rejects.toMatchObject({ code: 'not_found' });
  });
});
