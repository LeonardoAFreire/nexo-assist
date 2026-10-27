import { agentTurnSchema, type ChatMessage, messagePartSchema } from '@nexo/contracts';
import { z } from 'zod';
import type { messagesTable } from './messages.table.js';
import { parseStored } from './parse-stored.js';

export type MessageRow = typeof messagesTable.$inferSelect;

const partsSchema = z.array(messagePartSchema);
const turnSchema = agentTurnSchema.nullable();

export function toChatMessage(row: MessageRow): ChatMessage {
  const origin = `chat.messages ${row.id}`;
  return {
    id: row.id,
    conversationId: row.conversationId,
    author: row.author,
    authorName: row.authorName,
    authorLevel: row.authorLevel,
    text: row.text,
    parts: parseStored({ schema: partsSchema, value: row.parts, origin }),
    turn: parseStored({ schema: turnSchema, value: row.turn, origin }),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toMessageRow(message: ChatMessage): MessageRow {
  return { ...message, createdAt: new Date(message.createdAt) };
}
