import { z } from 'zod';

export const ticketTypeSchema = z.enum(['incident', 'request']);

export type TicketType = z.infer<typeof ticketTypeSchema>;
