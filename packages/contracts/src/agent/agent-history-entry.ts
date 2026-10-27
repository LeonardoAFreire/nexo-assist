import { z } from 'zod';
import { messageAuthorSchema } from '../chat/message-author.js';
import { messagePartSchema } from '../chat/message-part.js';

export const agentHistoryEntrySchema = z.object({
  author: messageAuthorSchema,
  authorLabel: z.string(),
  text: z.string(),
  parts: z.array(messagePartSchema),
});

export type AgentHistoryEntry = z.infer<typeof agentHistoryEntrySchema>;
