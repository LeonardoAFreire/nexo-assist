import { z } from 'zod';

export const pendingActionParamsSchema = z.strictObject({
  actionId: z.uuid(),
});

export type PendingActionParams = z.infer<typeof pendingActionParamsSchema>;
