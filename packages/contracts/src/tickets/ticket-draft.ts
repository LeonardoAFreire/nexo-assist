import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { priorityFactsSchema } from './priority-facts.js';
import { ticketAffectedSchema } from './ticket-affected.js';
import { ticketCategorySchema } from './ticket-category.js';
import { ticketPrioritySchema } from './ticket-priority.js';
import { ticketTypeSchema } from './ticket-type.js';

export const ticketDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: ticketTypeSchema,
  category: ticketCategorySchema,
  affected: ticketAffectedSchema,
  priorityFacts: priorityFactsSchema,
  priority: ticketPrioritySchema,
  dueAt: isoDateTimeSchema,
  rule: z.string(),
});

export type TicketDraft = z.infer<typeof ticketDraftSchema>;
