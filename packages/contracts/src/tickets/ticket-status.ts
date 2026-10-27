import { z } from 'zod';

export const ticketStatusSchema = z.enum([
  'open',
  'awaiting_analyst',
  'in_progress',
  'in_service',
  'approved',
  'resolved',
]);

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
