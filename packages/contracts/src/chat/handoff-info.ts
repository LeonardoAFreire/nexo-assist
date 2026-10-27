import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { supportLevelSchema } from '../identity/support-level.js';
import { ticketNumberSchema } from '../tickets/ticket-number.js';
import { handoffReasonSchema } from './handoff-reason.js';

export const handoffInfoSchema = z.object({
  reason: handoffReasonSchema,
  level: supportLevelSchema,
  summary: z.string(),
  ticketNumbers: z.array(ticketNumberSchema),
  confidence: z.number().min(0).max(1).nullable(),
  contactDueAt: isoDateTimeSchema,
  handedOffAt: isoDateTimeSchema,
});

export type HandoffInfo = z.infer<typeof handoffInfoSchema>;
