import { z } from 'zod';

export const handoffReasonSchema = z.enum([
  'requested',
  'critical',
  'overdue',
  'low_confidence',
  'failure',
]);

export type HandoffReason = z.infer<typeof handoffReasonSchema>;
