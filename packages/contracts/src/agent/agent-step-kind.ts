import { z } from 'zod';

export const agentStepKindSchema = z.enum([
  'understood',
  'searched_tickets',
  'viewed_ticket',
  'searched_knowledge',
  'cited_article',
  'classified_priority',
  'computed_deadline',
  'checked_duplicates',
  'built_draft',
  'proposed_update',
  'proposed_reopen',
  'asked_question',
  'handed_off',
  'executed_action',
]);

export type AgentStepKind = z.infer<typeof agentStepKindSchema>;
