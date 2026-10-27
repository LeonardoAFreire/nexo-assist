import type { MessageAuthor, SupportLevel } from '@nexo/contracts';
import { index, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { chatSchema } from './chat-schema.js';

export const messagesTable = chatSchema.table(
  'messages',
  {
    id: uuid('id').primaryKey(),
    conversationId: uuid('conversation_id').notNull(),
    author: text('author').$type<MessageAuthor>().notNull(),
    authorName: text('author_name'),
    authorLevel: text('author_level').$type<SupportLevel>(),
    text: text('text').notNull(),
    parts: jsonb('parts').$type<unknown>().notNull(),
    turn: jsonb('turn').$type<unknown>(),
    status: text('status').$type<'complete' | 'failed'>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [index('messages_conversation_created_idx').on(table.conversationId, table.createdAt)],
);
