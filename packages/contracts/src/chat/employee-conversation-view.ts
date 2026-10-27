import { z } from 'zod';
import { chatMessageSchema } from './chat-message.js';
import { conversationSchema } from './conversation.js';
import { messageUsageSchema } from './message-usage.js';

export const employeeConversationViewSchema = z.object({
  conversation: conversationSchema.nullable(),
  timeline: z.array(chatMessageSchema),
  usage: messageUsageSchema,
  turnInProgress: z.boolean(),
});

export type EmployeeConversationView = z.infer<typeof employeeConversationViewSchema>;
