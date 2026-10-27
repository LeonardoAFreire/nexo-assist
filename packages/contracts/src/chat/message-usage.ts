import { z } from 'zod';

export const messageUsageSchema = z.object({
  messagesUsed: z.number().int().nonnegative(),
  messagesLimit: z.number().int().positive(),
});

export type MessageUsage = z.infer<typeof messageUsageSchema>;
