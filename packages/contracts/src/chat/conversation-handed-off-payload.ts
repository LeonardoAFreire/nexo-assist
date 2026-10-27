import { z } from 'zod';
import { supportLevelSchema } from '../identity/support-level.js';
import { ticketNumberSchema } from '../tickets/ticket-number.js';
import { handoffReasonSchema } from './handoff-reason.js';

export const conversationHandedOffPayloadSchema = z.object({
  conversationId: z.uuid(),
  requesterId: z.uuid(),
  reason: handoffReasonSchema,
  level: supportLevelSchema,
  ticketNumbers: z.array(ticketNumberSchema),
});

export type ConversationHandedOffPayload = z.infer<typeof conversationHandedOffPayloadSchema>;
