import { z } from 'zod';
import { agentIntentSchema } from './agent-intent.js';

export const decisionUnderstoodSchema = z.object({
  intent: agentIntentSchema,
  intentLabel: z.string(),
  summary: z.string(),
  entities: z.array(z.object({ label: z.string(), value: z.string() })),
});

export type DecisionUnderstood = z.infer<typeof decisionUnderstoodSchema>;
