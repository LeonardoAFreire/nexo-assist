import { z } from 'zod';

export const agentIntentSchema = z.enum([
  'question',
  'ticket_status',
  'ticket_complement',
  'ticket_open',
  'analyst_request',
  'out_of_scope',
  'closing',
  'other',
]);

export type AgentIntent = z.infer<typeof agentIntentSchema>;
