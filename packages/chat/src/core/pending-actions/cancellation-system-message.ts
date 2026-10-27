import { randomUUID } from 'node:crypto';
import type { ChatMessage, PendingActionKind } from '@nexo/contracts';

const CANCELLATION_LABELS: Record<PendingActionKind, string> = {
  create_ticket: 'Você cancelou a abertura do chamado.',
  complement_ticket: 'Você cancelou a atualização do chamado.',
  reopen_ticket: 'Você cancelou a reabertura do chamado.',
};

export type CancellationMessageInput = {
  conversationId: string;
  kind: PendingActionKind;
  createdAt: string;
};

export function buildCancellationSystemMessage(input: CancellationMessageInput): ChatMessage {
  return {
    id: randomUUID(),
    conversationId: input.conversationId,
    author: 'system',
    authorName: null,
    authorLevel: null,
    text: CANCELLATION_LABELS[input.kind],
    parts: [],
    turn: null,
    status: 'complete',
    createdAt: input.createdAt,
  };
}
