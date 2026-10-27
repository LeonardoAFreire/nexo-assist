import { z } from 'zod';

export const ticketScopeSchema = z.enum(['open', 'closed', 'all']);

export type TicketScope = z.infer<typeof ticketScopeSchema>;
