import { z } from 'zod';
import { ticketScopeSchema } from './ticket-scope.js';

export const listTicketsQuerySchema = z.strictObject({
  scope: ticketScopeSchema.default('all'),
});

export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
