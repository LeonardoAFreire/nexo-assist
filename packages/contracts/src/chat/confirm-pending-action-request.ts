import { z } from 'zod';

export const confirmPendingActionRequestSchema = z.strictObject({
  via: z.enum(['button', 'shortcut']),
});

export type ConfirmPendingActionRequest = z.infer<typeof confirmPendingActionRequestSchema>;
