import { describe, expect, it } from 'vitest';
import { InMemoryConversationRepository } from '../conversation/in-memory-conversation-repository.js';
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

  it('não ressuscita o travamento do turno liberado entre a leitura e a gravação', async () => {
    const fixture = makeChatFixture();
    await seedConversation(fixture, { state: 'agent' });
    const lock = { conversationId: CONVERSATION_ID, now: '2026-10-26T13:00:00.000Z' };
    await fixture.conversations.acquireTurnLock({ ...lock, until: '2026-10-26T13:02:00.000Z' });
    const repository = new ReleasingAfterReadRepository(fixture.conversations);
    const sut = new MarkConversationRead(repository, fixture.notifier, fixture.clock);
    await sut.execute(CONVERSATION_ID);
    const stored = await fixture.conversations.findById(CONVERSATION_ID);
    expect(stored?.props.turnLockUntil).toBeNull();
    expect(stored?.props.analystReadAt).toBe('2026-10-26T13:05:00.000Z');
  });
});

class ReleasingAfterReadRepository extends InMemoryConversationRepository {
  constructor(private readonly inner: InMemoryConversationRepository) {
    super();
  }

  override async findById(id: string) {
    const snapshot = await this.inner.findById(id);
    await this.inner.releaseTurnLock(id);
    return snapshot;
  }

  override async save(conversation: Parameters<InMemoryConversationRepository['save']>[0]) {
    await this.inner.save(conversation);
  }

  override async markAnalystRead(conversationId: string, readAt: string) {
    await this.inner.releaseTurnLock(conversationId);
    return this.inner.markAnalystRead(conversationId, readAt);
  }
}
