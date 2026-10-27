import { integer, text, uuid } from 'drizzle-orm/pg-core';
import { chatSchema } from './chat-schema.js';

export const sessionUsageTable = chatSchema.table('session_usage', {
  sessionId: text('session_id').primaryKey(),
  userId: uuid('user_id').notNull(),
  employeeMessages: integer('employee_messages').notNull().default(0),
});
