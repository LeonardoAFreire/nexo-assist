import { z } from 'zod';

export const ticketAffectedSchema = z.enum(['only_me', 'my_team', 'whole_company', 'unknown']);

export type TicketAffected = z.infer<typeof ticketAffectedSchema>;
