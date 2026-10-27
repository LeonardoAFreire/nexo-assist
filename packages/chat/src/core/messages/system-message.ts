import { randomUUID } from 'node:crypto';
import type { ChatMessage, EventPart } from '@nexo/contracts';

export type SystemMessageInput = {
  conversationId: string;
  kind: EventPart['kind'];
  label: string;
  actorName: string | null;
  createdAt: string;
};

export function buildSystemMessage(input: SystemMessageInput): ChatMessage {
  return {
    id: randomUUID(),
    conversationId: input.conversationId,
    author: 'system',
    authorName: null,
    authorLevel: null,
    text: input.label,
    parts: [{ type: 'event', kind: input.kind, label: input.label, actorName: input.actorName }],
    turn: null,
    status: 'complete',
    createdAt: input.createdAt,
  };
}
