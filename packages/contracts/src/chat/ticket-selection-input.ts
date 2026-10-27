import { z } from 'zod';
import { ticketNumberSchema } from '../tickets/ticket-number.js';

export const ticketSelectionInputSchema = z.strictObject({
  messageId: z.uuid(),
  number: ticketNumberSchema,
});

export type TicketSelectionInput = z.infer<typeof ticketSelectionInputSchema>;
