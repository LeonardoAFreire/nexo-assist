import { z } from 'zod';

export const pendingActionStatusSchema = z.enum([
  'pending',
  'confirmed',
  'cancelled',
  'superseded',
  'failed',
]);

export type PendingActionStatus = z.infer<typeof pendingActionStatusSchema>;
