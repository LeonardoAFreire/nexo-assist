import { z } from 'zod';
import { agentIntentSchema } from './agent-intent.js';
import { understandingEntitiesSchema } from './understanding-entities.js';

export const understandingSchema = z.object({
  intent: agentIntentSchema,
  summary: z.string(),
  entities: understandingEntitiesSchema,
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export type Understanding = z.infer<typeof understandingSchema>;
