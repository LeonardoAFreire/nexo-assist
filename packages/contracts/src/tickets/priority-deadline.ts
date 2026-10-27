import { z } from 'zod';

export const priorityDeadlineSchema = z.object({
  amount: z.number().positive(),
  unit: z.enum(['clock_hours', 'business_hours', 'business_days']),
});

export type PriorityDeadline = z.infer<typeof priorityDeadlineSchema>;
