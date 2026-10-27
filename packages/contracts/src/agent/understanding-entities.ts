import { z } from 'zod';
import { ticketAffectedSchema } from '../tickets/ticket-affected.js';

export const understandingEntitiesSchema = z.object({
  ticketNumber: z.string().nullable(),
  operatingSystem: z.string().nullable(),
  symptom: z.string().nullable(),
  impact: ticketAffectedSchema.nullable(),
  sameDayCommitment: z.boolean().nullable(),
  hasWorkaround: z.boolean().nullable(),
  blocksWork: z.boolean().nullable(),
});

export type UnderstandingEntities = z.infer<typeof understandingEntitiesSchema>;
