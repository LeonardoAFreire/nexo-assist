import { z } from 'zod';
import { chatMessageSchema } from '../chat/chat-message.js';
import { conversationSchema } from '../chat/conversation.js';

export const consoleConversationDetailSchema = z.object({
  conversation: conversationSchema,
  timeline: z.array(chatMessageSchema),
});

export type ConsoleConversationDetail = z.infer<typeof consoleConversationDetailSchema>;
