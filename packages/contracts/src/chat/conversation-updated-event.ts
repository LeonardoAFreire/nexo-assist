import { z } from 'zod';
import { conversationSchema } from './conversation.js';

export const conversationUpdatedEventSchema = z.object({
  event: z.literal('conversation.updated'),
  data: z.object({ conversation: conversationSchema }),
});

export type ConversationUpdatedEvent = z.infer<typeof conversationUpdatedEventSchema>;
