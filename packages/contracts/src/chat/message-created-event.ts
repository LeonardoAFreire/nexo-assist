import { z } from 'zod';
import { chatMessageSchema } from './chat-message.js';

export const messageCreatedEventSchema = z.object({
  event: z.literal('message.created'),
  data: z.object({ message: chatMessageSchema }),
});

export type MessageCreatedEvent = z.infer<typeof messageCreatedEventSchema>;
