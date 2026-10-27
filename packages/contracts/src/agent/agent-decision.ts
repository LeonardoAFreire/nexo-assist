import { z } from 'zod';
import { handoffInfoSchema } from '../chat/handoff-info.js';
import { decisionActionSchema } from './decision-action.js';
import { decisionConfidenceSchema } from './decision-confidence.js';
import { decisionUnderstoodSchema } from './decision-understood.js';

export const agentDecisionSchema = z.object({
  understood: decisionUnderstoodSchema,
  action: decisionActionSchema,
  confidence: decisionConfidenceSchema,
  reason: z.string(),
  rules: z.array(z.string()),
  handoff: handoffInfoSchema.nullable(),
});

export type AgentDecision = z.infer<typeof agentDecisionSchema>;
