import { z } from 'zod';
import { ticketAffectedSchema } from './ticket-affected.js';
import { ticketTypeSchema } from './ticket-type.js';

export const priorityFactsSchema = z.object({
  impact: ticketAffectedSchema,
  blocksWork: z.boolean(),
  sameDayCommitment: z.boolean(),
  hasWorkaround: z.boolean(),
  kind: ticketTypeSchema,
});

export type PriorityFacts = z.infer<typeof priorityFactsSchema>;
