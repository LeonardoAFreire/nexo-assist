import { z } from 'zod';

export const conversationResolutionSchema = z.enum(['agent', 'analyst']);

export type ConversationResolution = z.infer<typeof conversationResolutionSchema>;
