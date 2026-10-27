import { z } from 'zod';

export const MESSAGE_TEXT_MAX_LENGTH = 2000;

export const messageTextSchema = z.string().trim().min(1).max(MESSAGE_TEXT_MAX_LENGTH);

export type MessageText = z.infer<typeof messageTextSchema>;
