import { z } from 'zod';
import { conversationUpdatedEventSchema } from './conversation-updated-event.js';
import { heartbeatEventSchema } from './heartbeat-event.js';
import { messageCreatedEventSchema } from './message-created-event.js';

export const conversationStreamEventSchema = z.discriminatedUnion('event', [
  conversationUpdatedEventSchema,
  messageCreatedEventSchema,
  heartbeatEventSchema,
]);

export type ConversationStreamEvent = z.infer<typeof conversationStreamEventSchema>;
