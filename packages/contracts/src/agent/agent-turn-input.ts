import { z } from 'zod';
import { pendingActionSchema } from '../chat/pending-action.js';
import { agentHistoryEntrySchema } from './agent-history-entry.js';
import { agentRequesterSchema } from './agent-requester.js';

export const agentTurnInputSchema = z.object({
  conversationId: z.uuid(),
  requester: agentRequesterSchema,
  history: z.array(agentHistoryEntrySchema),
  pendingAction: pendingActionSchema.nullable(),
  userMessage: z.string(),
  signal: z.custom<AbortSignal>(),
});

export type AgentTurnInput = z.infer<typeof agentTurnInputSchema>;
