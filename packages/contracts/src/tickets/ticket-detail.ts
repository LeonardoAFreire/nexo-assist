import { z } from 'zod';
import { ticketAffectedSchema } from './ticket-affected.js';
import { ticketSummarySchema } from './ticket-summary.js';

export const ticketDetailSchema = ticketSummarySchema.extend({
  description: z.string(),
  affected: ticketAffectedSchema,
});

export type TicketDetail = z.infer<typeof ticketDetailSchema>;
