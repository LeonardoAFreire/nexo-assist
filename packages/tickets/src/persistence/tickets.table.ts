import { sql } from 'drizzle-orm';
import { index, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { TICKET_SEARCH_VECTOR } from './ticket-search-vector.js';
import { ticketsSchema } from './tickets-schema.js';

export const ticketsTable = ticketsSchema.table(
  'tickets',
  {
    number: text('number').primaryKey(),
    type: text('type').notNull(),
    requesterId: uuid('requester_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(),
    priority: text('priority').notNull(),
    affected: text('affected').notNull(),
    status: text('status').notNull(),
    openedAt: timestamp('opened_at', { withTimezone: true, mode: 'date' }).notNull(),
    lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true, mode: 'date' }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('tickets_requester_status_idx').on(table.requesterId, table.status),
    index('tickets_search_idx').using('gin', sql.raw(TICKET_SEARCH_VECTOR)),
  ],
);
