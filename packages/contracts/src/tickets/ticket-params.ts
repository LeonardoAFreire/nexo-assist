import { z } from 'zod';
import { ticketNumberSchema } from './ticket-number.js';

export const ticketParamsSchema = z.strictObject({
  number: ticketNumberSchema,
});

export type TicketParams = z.infer<typeof ticketParamsSchema>;
