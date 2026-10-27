import { z } from 'zod';
import { messageTextSchema } from '../chat/message-text.js';

export const analystMessageRequestSchema = z.strictObject({
  text: messageTextSchema,
});

export type AnalystMessageRequest = z.infer<typeof analystMessageRequestSchema>;
