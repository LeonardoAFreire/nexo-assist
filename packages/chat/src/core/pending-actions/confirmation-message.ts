import { randomUUID } from 'node:crypto';
import type { AgentTurn, ChatMessage, PendingActionKind, TicketDetail } from '@nexo/contracts';

const TEXT_BY_KIND: Record<PendingActionKind, (ticketNumber: string) => string> = {
  create_ticket: (ticketNumber) => `Pronto, abri o chamado ${ticketNumber}.`,
  complement_ticket: (ticketNumber) => `Pronto, atualizei o chamado ${ticketNumber}.`,
  reopen_ticket: (ticketNumber) => `Pronto, reabri o chamado ${ticketNumber}.`,
};

export type ConfirmationMessageInput = {
  conversationId: string;
  kind: PendingActionKind;
  ticket: TicketDetail;
  turn: AgentTurn;
  createdAt: string;
};

export function buildConfirmationMessage(input: ConfirmationMessageInput): ChatMessage {
  return {
    id: randomUUID(),
    conversationId: input.conversationId,
    author: 'agent',
    authorName: null,
    authorLevel: null,
    text: TEXT_BY_KIND[input.kind](input.ticket.number),
    parts: [{ type: 'ticket_card', ticket: input.ticket }],
    turn: input.turn,
    status: 'complete',
    createdAt: input.createdAt,
  };
}
