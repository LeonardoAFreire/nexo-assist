import type { Database } from '@nexo/shared/database';
import { and, eq, isNull, lte, or } from 'drizzle-orm';
import type { AcquireTurnLockInput } from '../core/conversation/conversation-repository.js';
import { type ConversationRow } from './conversation-mapper.js';
import { conversationsTable } from './conversations.table.js';

type ReadMark = { conversationId: string; readAt: string };

export async function acquireLock(
  database: Database,
  input: AcquireTurnLockInput,
): Promise<ConversationRow | undefined> {
  const now = new Date(input.now);
  const free = or(
    isNull(conversationsTable.turnLockUntil),
    lte(conversationsTable.turnLockUntil, now),
  );
  const rows = await database
    .update(conversationsTable)
    .set({ turnLockUntil: new Date(input.until) })
    .where(and(eq(conversationsTable.id, input.conversationId), free))
    .returning();
  return rows[0];
}

export async function updateAnalystRead(
  database: Database,
  mark: ReadMark,
): Promise<ConversationRow | undefined> {
  const rows = await database
    .update(conversationsTable)
    .set({ analystReadAt: new Date(mark.readAt) })
    .where(eq(conversationsTable.id, mark.conversationId))
    .returning();
  return rows[0];
}

export async function releaseLock(database: Database, conversationId: string): Promise<void> {
  await database
    .update(conversationsTable)
    .set({ turnLockUntil: null })
    .where(eq(conversationsTable.id, conversationId));
}
