import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { ticketCategorySchema } from './ticket-category.js';
import { ticketLatestEventSchema } from './ticket-latest-event.js';
import { ticketNumberSchema } from './ticket-number.js';
import { ticketPrioritySchema } from './ticket-priority.js';
import { ticketStatusSchema } from './ticket-status.js';
import { ticketTypeSchema } from './ticket-type.js';

export const ticketSummarySchema = z.object({
  number: ticketNumberSchema,
  type: ticketTypeSchema,
  title: z.string(),
  category: ticketCategorySchema,
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  openedAt: isoDateTimeSchema,
  lastUpdatedAt: isoDateTimeSchema,
  resolvedAt: isoDateTimeSchema.nullable(),
  dueAt: isoDateTimeSchema.nullable(),
  overdue: z.boolean(),
  latestEvent: ticketLatestEventSchema.nullable(),
});

export type TicketSummary = z.infer<typeof ticketSummarySchema>;
