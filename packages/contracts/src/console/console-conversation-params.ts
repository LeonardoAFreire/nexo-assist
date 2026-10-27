import { z } from 'zod';

export const consoleConversationParamsSchema = z.strictObject({
  id: z.uuid(),
});

export type ConsoleConversationParams = z.infer<typeof consoleConversationParamsSchema>;
