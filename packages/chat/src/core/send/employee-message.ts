import { randomUUID } from 'node:crypto';
import type { ChatMessage } from '@nexo/contracts';

export type EmployeeMessageInput = {
  conversationId: string;
  authorName: string;
  text: string;
  createdAt: string;
};

export function buildEmployeeMessage(input: EmployeeMessageInput): ChatMessage {
  return {
    id: randomUUID(),
    conversationId: input.conversationId,
    author: 'employee',
    authorName: input.authorName,
    authorLevel: null,
    text: input.text,
    parts: [],
    turn: null,
    status: 'complete',
    createdAt: input.createdAt,
  };
}
