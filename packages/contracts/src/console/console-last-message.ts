import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { messageAuthorSchema } from '../chat/message-author.js';

export const LAST_MESSAGE_PREVIEW_MAX_LENGTH = 80;

export const consoleLastMessageSchema = z.object({
  preview: z.string().max(LAST_MESSAGE_PREVIEW_MAX_LENGTH),
  author: messageAuthorSchema,
  at: isoDateTimeSchema,
});

export type ConsoleLastMessage = z.infer<typeof consoleLastMessageSchema>;
