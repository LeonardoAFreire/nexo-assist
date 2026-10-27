import { z } from 'zod';

export const quickReplyInputSchema = z.strictObject({
  messageId: z.uuid(),
  optionId: z.string().min(1),
});

export type QuickReplyInput = z.infer<typeof quickReplyInputSchema>;
