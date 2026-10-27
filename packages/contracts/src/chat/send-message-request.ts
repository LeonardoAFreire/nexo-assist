import { z } from 'zod';
import { messageTextSchema } from './message-text.js';
import { quickReplyInputSchema } from './quick-reply-input.js';
import { ticketSelectionInputSchema } from './ticket-selection-input.js';

export const sendMessageRequestSchema = z.strictObject({
  text: messageTextSchema,
  quickReply: quickReplyInputSchema.nullable().default(null),
  ticketSelection: ticketSelectionInputSchema.nullable().default(null),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
