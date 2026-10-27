import { z } from 'zod';

export const consoleFilterSchema = z.enum(['all', 'for_you', 'with_agent', 'mine']);

export type ConsoleFilter = z.infer<typeof consoleFilterSchema>;
