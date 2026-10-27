import { z } from 'zod';

export const ticketPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export type TicketPriority = z.infer<typeof ticketPrioritySchema>;
