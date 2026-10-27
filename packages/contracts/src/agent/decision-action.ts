import { z } from 'zod';
import { agentStepKindSchema } from './agent-step-kind.js';

export const decisionActionKindSchema = z.enum([
  ...agentStepKindSchema.options,
  'replied',
  'degraded',
]);

export const decisionActionSchema = z.object({
  kind: decisionActionKindSchema,
  label: z.string(),
});

export type DecisionActionKind = z.infer<typeof decisionActionKindSchema>;
export type DecisionAction = z.infer<typeof decisionActionSchema>;
