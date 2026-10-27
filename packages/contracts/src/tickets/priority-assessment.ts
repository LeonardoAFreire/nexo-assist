import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { priorityDeadlineSchema } from './priority-deadline.js';
import { ticketPrioritySchema } from './ticket-priority.js';

export const priorityAssessmentSchema = z.object({
  priority: ticketPrioritySchema,
  deadline: priorityDeadlineSchema,
  dueAt: isoDateTimeSchema,
  rule: z.string(),
});

export type PriorityAssessment = z.infer<typeof priorityAssessmentSchema>;
