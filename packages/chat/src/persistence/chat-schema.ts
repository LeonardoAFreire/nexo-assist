import { pgSchema } from 'drizzle-orm/pg-core';

export const CHAT_SCHEMA = 'chat';

export const chatSchema = pgSchema(CHAT_SCHEMA);
