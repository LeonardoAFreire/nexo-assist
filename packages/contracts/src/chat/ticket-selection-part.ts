import { z } from 'zod';
import { ticketSummarySchema } from '../tickets/ticket-summary.js';

export const ticketSelectionPartSchema = z.object({
  type: z.literal('ticket_selection'),
  tickets: z.array(ticketSummarySchema),
  selectedNumber: z.string().nullable(),
});

export type TicketSelectionPart = z.infer<typeof ticketSelectionPartSchema>;
