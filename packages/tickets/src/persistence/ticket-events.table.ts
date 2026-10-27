import { sql } from 'drizzle-orm';
import { index, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { ticketsSchema } from './tickets-schema.js';
import { ticketsTable } from './tickets.table.js';

export const ticketEventsTable = ticketsSchema.table(
  'ticket_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketNumber: text('ticket_number')
      .notNull()
      .references(() => ticketsTable.number),
    kind: text('kind').notNull(),
    body: text('body').notNull(),
    idempotencyKey: text('idempotency_key'),
    actor: text('actor').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    index('ticket_events_ticket_idx').on(table.ticketNumber, table.occurredAt),
    uniqueIndex('ticket_events_idempotency_key_idx')
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);
