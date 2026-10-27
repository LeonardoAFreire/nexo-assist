import { z } from 'zod';

export const decisionConfidenceSchema = z.object({
  value: z.number().min(0).max(1),
  label: z.enum(['alta', 'média', 'baixa']),
});

export type DecisionConfidence = z.infer<typeof decisionConfidenceSchema>;
