import { z } from 'zod';

export const conversationStateSchema = z.enum([
  'agent',
  'waiting_analyst',
  'with_analyst',
  'closed',
]);

export type ConversationState = z.infer<typeof conversationStateSchema>;
