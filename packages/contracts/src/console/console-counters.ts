import { z } from 'zod';

const counterSchema = z.number().int().nonnegative();

export const consoleCountersSchema = z.object({
  all: counterSchema,
  for_you: counterSchema,
  with_agent: counterSchema,
  mine: counterSchema,
});

export type ConsoleCounters = z.infer<typeof consoleCountersSchema>;
