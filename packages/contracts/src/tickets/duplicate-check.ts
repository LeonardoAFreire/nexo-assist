import { z } from 'zod';
import { ticketSummarySchema } from './ticket-summary.js';

export const duplicateCheckSchema = z.object({
  openMatches: z.array(ticketSummarySchema),
  reopenable: z.array(ticketSummarySchema),
  expiredResolved: z.array(ticketSummarySchema),
  rule: z.string(),
});

export type DuplicateCheck = z.infer<typeof duplicateCheckSchema>;
