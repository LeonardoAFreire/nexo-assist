import { z } from 'zod';
import { agentTurnSchema } from '../agent/agent-turn.js';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { supportLevelSchema } from '../identity/support-level.js';
import { messageAuthorSchema } from './message-author.js';
import { messagePartSchema } from './message-part.js';

export const chatMessageSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  author: messageAuthorSchema,
  authorName: z.string().nullable(),
  authorLevel: supportLevelSchema.nullable(),
  text: z.string(),
  parts: z.array(messagePartSchema),
  turn: agentTurnSchema.nullable(),
  status: z.enum(['complete', 'failed']),
  createdAt: isoDateTimeSchema,
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
