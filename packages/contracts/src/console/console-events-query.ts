import { z } from 'zod';

export const consoleEventsQuerySchema = z.strictObject({
  conversationId: z.uuid().optional(),
});

export type ConsoleEventsQuery = z.infer<typeof consoleEventsQuerySchema>;
