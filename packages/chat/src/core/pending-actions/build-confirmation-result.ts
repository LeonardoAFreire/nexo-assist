import type { ChatMessage, ConfirmationChannel } from '@nexo/contracts';
import { buildConfirmationMessage } from './confirmation-message.js';
import { buildConfirmationTurn } from './confirmation-turn.js';
import type { PendingActionRecord } from './pending-action-record.js';
import type { TicketWriteResult } from './ticket-writer.js';

export type ConfirmPendingActionResult = {
  action: PendingActionRecord;
  message: ChatMessage;
};

export type ConfirmationContext = {
  record: PendingActionRecord;
  via: ConfirmationChannel;
  written: TicketWriteResult;
  startedAt: Date;
  finishedAt: Date;
};

export function buildConfirmationResult(context: ConfirmationContext): ConfirmPendingActionResult {
  const { record, written, finishedAt } = context;
  const action: PendingActionRecord = {
    ...record,
    status: 'confirmed',
    resultTicket: written.ticket,
    confirmedVia: context.via,
    resolvedAt: finishedAt.toISOString(),
  };
  const turn = buildConfirmationTurn({
    kind: record.kind,
    via: context.via,
    ticketNumber: written.ticket.number,
    attempts: written.attempts,
    durationMs: finishedAt.getTime() - context.startedAt.getTime(),
  });
  const message = buildConfirmationMessage({
    conversationId: record.conversationId,
    kind: record.kind,
    ticket: written.ticket,
    turn,
    createdAt: finishedAt.toISOString(),
  });
  return { action, message };
}
