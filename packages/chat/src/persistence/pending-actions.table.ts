import type { ConfirmationChannel, PendingActionKind, PendingActionStatus } from '@nexo/contracts';
import { sql } from 'drizzle-orm';
import { jsonb, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { chatSchema } from './chat-schema.js';

export const DISPLAY_NUMBER_SEQUENCE = 'pending_action_display_seq';
export const DISPLAY_NUMBER_SEQUENCE_START = 381;

export const displayNumberSequence = chatSchema.sequence(DISPLAY_NUMBER_SEQUENCE, {
  startWith: DISPLAY_NUMBER_SEQUENCE_START,
});

export const pendingActionsTable = chatSchema.table(
  'pending_actions',
  {
    id: uuid('id').primaryKey(),
    conversationId: uuid('conversation_id').notNull(),
    displayNumber: text('display_number').notNull(),
    kind: text('kind').$type<PendingActionKind>().notNull(),
    status: text('status').$type<PendingActionStatus>().notNull(),
    payload: jsonb('payload').$type<unknown>().notNull(),
    resultTicketNumber: text('result_ticket_number'),
    confirmedVia: text('confirmed_via').$type<ConfirmationChannel>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    uniqueIndex('pending_actions_one_pending_idx')
      .on(table.conversationId)
      .where(sql`${table.status} = 'pending'`),
  ],
);
