import { z } from 'zod';
import { handoffReasonSchema } from '../chat/handoff-reason.js';
import { messagePartSchema } from '../chat/message-part.js';
import { pendingActionKindSchema } from '../chat/pending-action-kind.js';
import { ticketDraftSchema } from '../tickets/ticket-draft.js';
import { agentDecisionSchema } from './agent-decision.js';
import { agentStepSchema } from './agent-step.js';

export const agentTurnEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('step'), step: agentStepSchema }),
  z.object({ type: z.literal('text-delta'), delta: z.string() }),
  z.object({ type: z.literal('part'), part: messagePartSchema }),
  z.object({
    type: z.literal('proposal'),
    kind: pendingActionKindSchema,
    draft: ticketDraftSchema.nullable(),
    targetNumber: z.string().nullable(),
    complement: z.string().nullable(),
  }),
  z.object({
    type: z.literal('handoff-requested'),
    reason: handoffReasonSchema,
    summary: z.string(),
    confidence: z.number().min(0).max(1).nullable(),
  }),
  z.object({
    type: z.literal('completed'),
    text: z.string(),
    steps: z.array(agentStepSchema),
    decision: agentDecisionSchema,
    runId: z.string(),
  }),
  z.object({
    type: z.literal('failed'),
    code: z.enum(['agent_unavailable', 'budget_exhausted']),
    retryable: z.boolean(),
  }),
]);

export type AgentTurnEvent = z.infer<typeof agentTurnEventSchema>;
