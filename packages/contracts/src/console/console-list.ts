import { z } from 'zod';
import { consoleConversationItemSchema } from './console-conversation-item.js';
import { consoleCountersSchema } from './console-counters.js';

export const consoleListSchema = z.object({
  items: z.array(consoleConversationItemSchema),
  counters: consoleCountersSchema,
});

export type ConsoleList = z.infer<typeof consoleListSchema>;
