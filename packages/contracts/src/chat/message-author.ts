import { z } from 'zod';

export const messageAuthorSchema = z.enum(['employee', 'agent', 'analyst', 'system']);

export type MessageAuthor = z.infer<typeof messageAuthorSchema>;
