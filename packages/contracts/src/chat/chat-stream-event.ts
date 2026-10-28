import { z } from 'zod';
import { agentStepSchema } from '../agent/agent-step.js';
import { apiErrorSchema } from '../api-error.js';
import { chatMessageSchema } from './chat-message.js';
import { conversationSchema } from './conversation.js';
import { messagePartSchema } from './message-part.js';
import { messageUsageSchema } from './message-usage.js';

export const chatStreamEventSchema = z.discriminatedUnion('event', [
  z.object({
    event: z.literal('message.accepted'),
    data: z.object({ message: chatMessageSchema, usage: messageUsageSchema }),
  }),
  z.object({ event: z.literal('turn.started'), data: z.object({ replyId: z.uuid() }) }),
  z.object({ event: z.literal('turn.step'), data: z.object({ step: agentStepSchema }) }),
  z.object({ event: z.literal('turn.text-delta'), data: z.object({ delta: z.string() }) }),
  z.object({ event: z.literal('turn.part'), data: z.object({ part: messagePartSchema }) }),
  z.object({
    event: z.literal('turn.completed'),
    data: z.object({
      message: chatMessageSchema,
      conversation: conversationSchema,
      usage: messageUsageSchema,
    }),
  }),
  z.object({
    event: z.literal('turn.skipped'),
    data: z.object({ reason: z.enum(['with_analyst', 'waiting_analyst']) }),
  }),
  z.object({
    event: z.literal('turn.failed'),
    data: apiErrorSchema.extend({ retryable: z.boolean() }),
  }),
]);

export type ChatStreamEvent = z.infer<typeof chatStreamEventSchema>;
