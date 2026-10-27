import { z } from 'zod';

export const apiErrorCodes = [
  'validation_error',
  'invalid_credentials',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conversation_already_claimed',
  'conversation_not_claimed',
  'invalid_conversation_state',
  'pending_action_not_pending',
  'turn_in_progress',
  'ticket_rule_violation',
  'message_limit_reached',
  'rate_limited',
  'tickets_unavailable',
  'agent_unavailable',
  'budget_exhausted',
  'internal_error',
] as const;

export const apiErrorCodeSchema = z.enum(apiErrorCodes);

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
