import { z } from 'zod';
import { userProfileSchema } from '../identity/user-profile.js';
import { ticketNumberSchema } from '../tickets/ticket-number.js';
import { consoleLastMessageSchema } from './console-last-message.js';
import { consoleStatusSchema } from './console-status.js';

export const consoleConversationItemSchema = z.object({
  id: z.uuid(),
  employee: userProfileSchema,
  lastMessage: consoleLastMessageSchema,
  unreadCount: z.number().int().nonnegative(),
  consoleStatus: consoleStatusSchema,
  statusDetail: z.string().nullable(),
  ticketNumbers: z.array(ticketNumberSchema),
});

export type ConsoleConversationItem = z.infer<typeof consoleConversationItemSchema>;
