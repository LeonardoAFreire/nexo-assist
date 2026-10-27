import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type Database } from '@nexo/shared/database';
import { and, eq, ne } from 'drizzle-orm';
import { Conversation } from '../core/conversation/conversation.js';
import type {
  AcquireTurnLockInput,
  ConversationRepository,
  SaveWhenStateInput,
} from '../core/conversation/conversation-repository.js';
import {
  type ConversationRow,
  toConversationProps,
  toConversationRow,
} from './conversation-mapper.js';
import { acquireLock, releaseLock, updateAnalystRead } from './conversation-column-updates.js';
import { conversationsTable } from './conversations.table.js';

function toConversation(row: ConversationRow | undefined): Conversation | null {
  return row === undefined ? null : new Conversation(toConversationProps(row));
}

@Injectable()
export class DrizzleConversationRepository implements ConversationRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async findById(id: string): Promise<Conversation | null> {
    const rows = await this.database
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));
    return toConversation(rows[0]);
  }

  async findActiveByEmployee(employeeId: string): Promise<Conversation | null> {
    const rows = await this.database
      .select()
      .from(conversationsTable)
      .where(
        and(eq(conversationsTable.employeeId, employeeId), ne(conversationsTable.state, 'closed')),
      );
    return toConversation(rows[0]);
  }

  async listByEmployee(employeeId: string): Promise<Conversation[]> {
    const rows = await this.database
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.employeeId, employeeId));
    return rows.map((row) => new Conversation(toConversationProps(row)));
  }

  async listAll(): Promise<Conversation[]> {
    const rows = await this.database.select().from(conversationsTable);
    return rows.map((row) => new Conversation(toConversationProps(row)));
  }

  async save(conversation: Conversation): Promise<void> {
    const row = toConversationRow(conversation.props);
    await this.database
      .insert(conversationsTable)
      .values(row)
      .onConflictDoUpdate({ target: conversationsTable.id, set: row });
  }

  async saveWhenState(input: SaveWhenStateInput): Promise<boolean> {
    const row = toConversationRow(input.conversation.props);
    const updated = await this.database
      .update(conversationsTable)
      .set(row)
      .where(
        and(eq(conversationsTable.id, row.id), eq(conversationsTable.state, input.expectedState)),
      )
      .returning({ id: conversationsTable.id });
    return updated.length > 0;
  }

  async acquireTurnLock(input: AcquireTurnLockInput): Promise<Conversation | null> {
    return toConversation(await acquireLock(this.database, input));
  }

  async markAnalystRead(conversationId: string, readAt: string): Promise<Conversation | null> {
    return toConversation(await updateAnalystRead(this.database, { conversationId, readAt }));
  }

  async releaseTurnLock(conversationId: string): Promise<void> {
    await releaseLock(this.database, conversationId);
  }
}
