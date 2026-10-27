import { z } from 'zod';

export const quickOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export type QuickOption = z.infer<typeof quickOptionSchema>;
