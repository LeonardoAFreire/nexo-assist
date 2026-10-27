import { z } from 'zod';

export const consoleStatusSchema = z.enum([
  'transferred',
  'agent_asked_help',
  'agent_attending',
  'you_are_attending',
  'attended_by_other',
  'resolved_by_agent',
  'closed',
]);

export type ConsoleStatus = z.infer<typeof consoleStatusSchema>;
