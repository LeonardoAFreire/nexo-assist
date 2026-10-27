import { z } from 'zod';
import { pendingActionSchema } from './pending-action.js';

export const pendingActionPartSchema = z.object({
  type: z.literal('pending_action'),
  action: pendingActionSchema,
});

export type PendingActionPart = z.infer<typeof pendingActionPartSchema>;
