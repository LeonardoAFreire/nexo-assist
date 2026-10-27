import { z } from 'zod';
import { conversationUpdatedEventSchema } from '../chat/conversation-updated-event.js';
import { heartbeatEventSchema } from '../chat/heartbeat-event.js';
import { messageCreatedEventSchema } from '../chat/message-created-event.js';
import { consoleItemUpdatedEventSchema } from './console-item-updated-event.js';

export const consoleStreamEventSchema = z.discriminatedUnion('event', [
  consoleItemUpdatedEventSchema,
  conversationUpdatedEventSchema,
  messageCreatedEventSchema,
  heartbeatEventSchema,
]);

export type ConsoleStreamEvent = z.infer<typeof consoleStreamEventSchema>;
