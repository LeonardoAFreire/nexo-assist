import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';

export const ticketLatestEventSchema = z.object({
  kind: z.string(),
  at: isoDateTimeSchema,
  label: z.string(),
});

export type TicketLatestEvent = z.infer<typeof ticketLatestEventSchema>;
