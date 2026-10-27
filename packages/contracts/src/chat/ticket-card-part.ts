import { z } from 'zod';
import { ticketDetailSchema } from '../tickets/ticket-detail.js';

export const ticketCardPartSchema = z.object({
  type: z.literal('ticket_card'),
  ticket: ticketDetailSchema,
});

export type TicketCardPart = z.infer<typeof ticketCardPartSchema>;
