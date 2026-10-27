import { z } from 'zod';
import { agentDecisionSchema } from './agent-decision.js';
import { agentStepSchema } from './agent-step.js';

export const agentTurnSchema = z.object({
  steps: z.array(agentStepSchema),
  decision: agentDecisionSchema,
});

export type AgentTurn = z.infer<typeof agentTurnSchema>;
