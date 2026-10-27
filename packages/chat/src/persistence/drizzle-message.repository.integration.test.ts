import type { ChatMessage } from '@nexo/contracts';
import type { TestDatabase } from '@nexo/shared/database/testing';
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CONVERSATION_ID } from '../core/testing/factories.js';
import { CorruptedRecordError } from './corrupted-record.error.js';
import { DrizzleMessageRepository } from './drizzle-message.repository.js';
import { messagesTable } from './messages.table.js';
import { createMigratedDatabase } from './testing/migrated-database.js';

const OTHER_CONVERSATION_ID = 'c71a2b3c-1d2e-4f50-8a61-7b8c9d0e1f21';

function makeMessage(order: number, conversationId = CONVERSATION_ID): ChatMessage {
  return {
    id: `00000000-0000-4000-8000-00000000000${order}`,
    conversationId,
    author: 'agent',
    authorName: null,
    authorLevel: null,
    text: `mensagem ${order}`,
    parts: [{ type: 'event', kind: 'claimed', label: 'Assumiu', actorName: null }],
    turn: null,
    status: 'complete',
    createdAt: `2026-10-26T10:0${order}:00.000Z`,
  };
}

describe('DrizzleMessageRepository', () => {
  let testDatabase: TestDatabase;
  let repository: DrizzleMessageRepository;

  beforeEach(async () => {
    testDatabase = await createMigratedDatabase();
    repository = new DrizzleMessageRepository(testDatabase.database);
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('lista as últimas mensagens da conversa em ordem cronológica', async () => {
    await repository.save(makeMessage(3));
    await repository.save(makeMessage(1));
    await repository.save(makeMessage(2));
    await repository.save(makeMessage(4, OTHER_CONVERSATION_ID));
    const recent = await repository.listRecent({ conversationId: CONVERSATION_ID, limit: 2 });
    expect(recent.map((message) => message.text)).toEqual(['mensagem 2', 'mensagem 3']);
  });

  it('lista as últimas mensagens de várias conversas juntas', async () => {
    await repository.save(makeMessage(1));
    await repository.save(makeMessage(2, OTHER_CONVERSATION_ID));
    const recent = await repository.listRecentByConversations({
      conversationIds: [CONVERSATION_ID, OTHER_CONVERSATION_ID],
      limit: 10,
    });
    expect(recent.map((message) => message.text)).toEqual(['mensagem 1', 'mensagem 2']);
    expect(await repository.listRecentByConversations({ conversationIds: [], limit: 5 })).toEqual(
      [],
    );
  });

  it('preserva as partes e encontra a mensagem pelo id', async () => {
    const message = makeMessage(1);
    await repository.save(message);
    expect(await repository.findById(message.id)).toEqual(message);
    expect(await repository.findById('00000000-0000-4000-8000-0000000000ff')).toBeNull();
  });

  it('falha de forma explícita quando o jsonb das partes está corrompido', async () => {
    const message = makeMessage(1);
    await repository.save(message);
    await testDatabase.database
      .update(messagesTable)
      .set({ parts: [{ type: 'video' }] })
      .where(eq(messagesTable.id, message.id));
    await expect(repository.findById(message.id)).rejects.toBeInstanceOf(CorruptedRecordError);
  });
});
