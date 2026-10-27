import { z } from 'zod';
import { consoleFilterSchema } from './console-filter.js';

export const CONSOLE_SEARCH_MAX_LENGTH = 60;

export const consoleListQuerySchema = z.strictObject({
  filter: consoleFilterSchema.default('all'),
  q: z.string().trim().max(CONSOLE_SEARCH_MAX_LENGTH).optional(),
});

export type ConsoleListQuery = z.infer<typeof consoleListQuerySchema>;
