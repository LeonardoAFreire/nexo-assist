import { z } from 'zod';
import { consoleConversationItemSchema } from './console-conversation-item.js';
import { consoleCountersSchema } from './console-counters.js';

export const consoleItemUpdatedEventSchema = z.object({
  event: z.literal('console.item.updated'),
  data: z.object({
    item: consoleConversationItemSchema,
    counters: consoleCountersSchema,
  }),
});

export type ConsoleItemUpdatedEvent = z.infer<typeof consoleItemUpdatedEventSchema>;
