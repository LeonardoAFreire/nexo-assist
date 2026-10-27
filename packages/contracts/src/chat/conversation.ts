import { z } from 'zod';
import { isoDateTimeSchema } from '../common/iso-date-time.js';
import { userProfileSchema } from '../identity/user-profile.js';
import { conversationResolutionSchema } from './conversation-resolution.js';
import { conversationStateSchema } from './conversation-state.js';
import { handoffInfoSchema } from './handoff-info.js';
import { pendingActionSchema } from './pending-action.js';

export const conversationSchema = z.object({
  id: z.uuid(),
  employee: userProfileSchema,
  state: conversationStateSchema,
  resolution: conversationResolutionSchema.nullable(),
  assignedAnalyst: userProfileSchema.nullable(),
  handoff: handoffInfoSchema.nullable(),
  pendingAction: pendingActionSchema.nullable(),
  lastMessageAt: isoDateTimeSchema,
});

export type Conversation = z.infer<typeof conversationSchema>;
