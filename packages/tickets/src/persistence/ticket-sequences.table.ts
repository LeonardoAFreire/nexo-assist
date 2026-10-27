import { integer, text } from 'drizzle-orm/pg-core';
import { ticketsSchema } from './tickets-schema.js';

export const ticketSequencesTable = ticketsSchema.table('ticket_sequences', {
  type: text('type').primaryKey(),
  nextValue: integer('next_value').notNull(),
});
