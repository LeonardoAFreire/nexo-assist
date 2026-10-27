import type { ConversationResolution, ConversationState } from '@nexo/contracts';
import { sql } from 'drizzle-orm';
import { index, jsonb, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { chatSchema } from './chat-schema.js';

export const conversationsTable = chatSchema.table(
  'conversations',
  {
    id: uuid('id').primaryKey(),
    employeeId: uuid('employee_id').notNull(),
    state: text('state').$type<ConversationState>().notNull(),
    resolution: text('resolution').$type<ConversationResolution>(),
    assignedAnalystId: uuid('assigned_analyst_id'),
    handoff: jsonb('handoff').$type<unknown>(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true, mode: 'date' }).notNull(),
    analystReadAt: timestamp('analyst_read_at', { withTimezone: true, mode: 'date' }),
    turnLockUntil: timestamp('turn_lock_until', { withTimezone: true, mode: 'date' }),
    closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('conversations_active_employee_idx')
      .on(table.employeeId)
      .where(sql`${table.state} <> 'closed'`),
    index('conversations_last_message_idx').on(table.lastMessageAt),
  ],
);
