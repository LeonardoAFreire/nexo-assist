import { Inject, Injectable } from '@nestjs/common';
import type { ChatMessage } from '@nexo/contracts';
import { DATABASE, type Database } from '@nexo/shared/database';
import { desc, eq, inArray } from 'drizzle-orm';
import type {
  ListRecentByConversationsInput,
  ListRecentMessagesInput,
  MessageRepository,
} from '../core/messages/message-repository.js';
import { toChatMessage, toMessageRow } from './message-mapper.js';
import { messagesTable } from './messages.table.js';

@Injectable()
export class DrizzleMessageRepository implements MessageRepository {
  constructor(@Inject(DATABASE) private readonly database: Database) {}

  async save(message: ChatMessage): Promise<void> {
    const row = toMessageRow(message);
    await this.database
      .insert(messagesTable)
      .values(row)
      .onConflictDoUpdate({ target: messagesTable.id, set: row });
  }

  async findById(id: string): Promise<ChatMessage | null> {
    const rows = await this.database.select().from(messagesTable).where(eq(messagesTable.id, id));
    const row = rows[0];
    return row === undefined ? null : toChatMessage(row);
  }

  async listRecent(input: ListRecentMessagesInput): Promise<ChatMessage[]> {
    return this.recentOf([input.conversationId], input.limit);
  }

  async listRecentByConversations(input: ListRecentByConversationsInput): Promise<ChatMessage[]> {
    return this.recentOf(input.conversationIds, input.limit);
  }

  private async recentOf(conversationIds: string[], limit: number): Promise<ChatMessage[]> {
    if (conversationIds.length === 0) {
      return [];
    }
    const rows = await this.database
      .select()
      .from(messagesTable)
      .where(inArray(messagesTable.conversationId, conversationIds))
      .orderBy(desc(messagesTable.createdAt), desc(messagesTable.id))
      .limit(limit);
    return rows.map(toChatMessage).reverse();
  }
}
