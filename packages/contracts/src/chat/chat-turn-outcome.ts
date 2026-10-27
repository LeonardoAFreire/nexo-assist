import { z } from 'zod';
import { chatMessageSchema } from './chat-message.js';
import { conversationSchema } from './conversation.js';

export const chatTurnOutcomeSchema = z.object({
  message: chatMessageSchema,
  conversation: conversationSchema,
});

export type ChatTurnOutcome = z.infer<typeof chatTurnOutcomeSchema>;
