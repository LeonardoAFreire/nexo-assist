import { z } from 'zod';
import { quickOptionSchema } from './quick-option.js';

export const quickOptionsPartSchema = z.object({
  type: z.literal('quick_options'),
  question: z.string(),
  options: z.array(quickOptionSchema),
  answered: z.boolean(),
});

export type QuickOptionsPart = z.infer<typeof quickOptionsPartSchema>;
