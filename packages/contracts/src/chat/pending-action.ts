import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { ticketDetailSchema } from '../tickets/ticket-detail.js';
import { ticketDraftSchema } from '../tickets/ticket-draft.js';
import { confirmationChannelSchema } from './confirmation-channel.js';
import { pendingActionKindSchema } from './pending-action-kind.js';
import { pendingActionStatusSchema } from './pending-action-status.js';

export const pendingActionSchema = z.object({
  id: z.uuid(),
  displayNumber: z.string(),
  kind: pendingActionKindSchema,
  status: pendingActionStatusSchema,
  draft: ticketDraftSchema.nullable(),
  targetNumber: z.string().nullable(),
  complement: z.string().nullable(),
  resultTicket: ticketDetailSchema.nullable(),
  confirmedVia: confirmationChannelSchema.nullable(),
  createdAt: isoDateTimeSchema,
  resolvedAt: isoDateTimeSchema.nullable(),
});

export type PendingAction = z.infer<typeof pendingActionSchema>;
