import { z } from 'zod';
import { agentStepKindSchema } from './agent-step-kind.js';

export const agentStepSchema = z.object({
  id: z.string(),
  kind: agentStepKindSchema,
  label: z.string(),
  result: z.string(),
  status: z.enum(['ok', 'failed']),
  attempts: z.number().int().positive(),
  durationMs: z.number().nonnegative(),
});

export type AgentStep = z.infer<typeof agentStepSchema>;
