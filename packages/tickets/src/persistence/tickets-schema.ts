import { pgSchema } from 'drizzle-orm/pg-core';

export const TICKETS_SCHEMA = 'tickets';

export const ticketsSchema = pgSchema(TICKETS_SCHEMA);
