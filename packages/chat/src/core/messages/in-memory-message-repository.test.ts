import type { ChatMessage } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { CONVERSATION_ID } from '../testing/factories.js';
import { InMemoryMessageRepository } from './in-memory-message-repository.js';

function makeMessage(id: string, createdAt: string, conversationId = CONVERSATION_ID): ChatMessage {
  return {
    id,
    conversationId,
    author: 'employee',
    authorName: null,
    authorLevel: null,
    text: id,
    parts: [],
    turn: null,
    status: 'complete',
    createdAt,
  };
}

describe('InMemoryMessageRepository', () => {
  it('lista as últimas mensagens da conversa em ordem cronológica', async () => {
    const repository = new InMemoryMessageRepository();
    await repository.save(makeMessage('c', '2026-10-26T10:03:00.000Z'));
    await repository.save(makeMessage('a', '2026-10-26T10:01:00.000Z'));
    await repository.save(makeMessage('b', '2026-10-26T10:02:00.000Z'));
    await repository.save(makeMessage('x', '2026-10-26T10:00:00.000Z', 'outra'));
    const recent = await repository.listRecent({ conversationId: CONVERSATION_ID, limit: 2 });
    expect(recent.map((message) => message.id)).toEqual(['b', 'c']);
  });

  it('encontra a mensagem pelo id e devolve null quando não existe', async () => {
    const repository = new InMemoryMessageRepository();
    await repository.save(makeMessage('a', '2026-10-26T10:01:00.000Z'));
    expect((await repository.findById('a'))?.text).toBe('a');
    expect(await repository.findById('zzz')).toBeNull();
  });
});
