import type { ChatMessage } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { type ChatFixture, makeChatFixture } from '../testing/chat-fixture.js';
import { CONVERSATION_ID, NOW_ISO } from '../testing/factories.js';
import { seedConversation, type SeedState } from '../testing/conversation-seeds.js';
import { RecoverInterruptedTurns } from './recover-interrupted-turns.js';

const LOCK_UNTIL = '2026-10-26T13:07:00.000Z';

function makeMessage(author: 'employee' | 'agent', createdAt: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    conversationId: CONVERSATION_ID,
    author,
    authorName: null,
    authorLevel: null,
    text: 'Como está o INC-20311?',
    parts: [],
    turn: null,
    status: 'complete',
    createdAt,
  };
}

async function seedLockedTurn(fixture: ChatFixture, state: SeedState): Promise<void> {
  await seedConversation(fixture, { state });
  await fixture.conversations.acquireTurnLock({
    conversationId: CONVERSATION_ID,
    now: NOW_ISO,
    until: LOCK_UNTIL,
  });
}

async function lastMessage(fixture: ChatFixture): Promise<ChatMessage | undefined> {
  const recent = await fixture.messages.listRecent({ conversationId: CONVERSATION_ID, limit: 5 });
  return recent.at(-1);
}

describe('RecoverInterruptedTurns', () => {
  it('libera o travamento e registra a falha quando o funcionário ficou sem resposta', async () => {
    const fixture = makeChatFixture();
    await seedLockedTurn(fixture, 'agent');
    await fixture.messages.save(makeMessage('employee', NOW_ISO));
    const recovered = await new RecoverInterruptedTurns(fixture).execute();
    const conversation = await fixture.conversations.findById(CONVERSATION_ID);
    const last = await lastMessage(fixture);
    expect(recovered).toBe(1);
    expect(conversation?.props.turnLockUntil).toBeNull();
    expect(last).toMatchObject({ author: 'agent', status: 'failed' });
  });

  it('só libera o travamento quando o agent já tinha respondido', async () => {
    const fixture = makeChatFixture();
    await seedLockedTurn(fixture, 'agent');
    await fixture.messages.save(makeMessage('agent', NOW_ISO));
    await new RecoverInterruptedTurns(fixture).execute();
    const conversation = await fixture.conversations.findById(CONVERSATION_ID);
    expect(conversation?.props.turnLockUntil).toBeNull();
    expect(await lastMessage(fixture)).toMatchObject({ author: 'agent', status: 'complete' });
  });

  it('não escreve resposta de agent numa conversa que está com o analista', async () => {
    const fixture = makeChatFixture();
    await seedLockedTurn(fixture, 'with_analyst');
    await fixture.messages.save(makeMessage('employee', NOW_ISO));
    await new RecoverInterruptedTurns(fixture).execute();
    expect(await lastMessage(fixture)).toMatchObject({ author: 'employee' });
  });

  it('ignora conversas sem travamento', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'agent' });
    await fixture.messages.save(makeMessage('employee', NOW_ISO));
    expect(await new RecoverInterruptedTurns(fixture).execute()).toBe(0);
    expect(await lastMessage(fixture)).toMatchObject({ author: 'employee' });
  });
});
