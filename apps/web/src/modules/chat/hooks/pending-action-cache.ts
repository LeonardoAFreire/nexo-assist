import type {
  ChatMessage,
  ChatTurnOutcome,
  ConfirmationChannel,
  MessagePart,
  PendingAction,
  TicketDetail,
} from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { appendUnique, updateView } from './conversation-cache.js';

function replaceInPart(part: MessagePart, action: PendingAction): MessagePart {
  const isTarget = part.type === 'pending_action' && part.action.id === action.id;
  return isTarget ? { ...part, action } : part;
}

function replaceInMessage(message: ChatMessage, action: PendingAction): ChatMessage {
  return { ...message, parts: message.parts.map((part) => replaceInPart(part, action)) };
}

function nextPendingAction(current: PendingAction | null, action: PendingAction) {
  if (current?.id !== action.id) {
    return current;
  }
  return action.status === 'pending' ? action : null;
}

export function applyActionUpdate(queryClient: QueryClient, action: PendingAction): void {
  updateView(queryClient, (view) => ({
    ...view,
    conversation: view.conversation && {
      ...view.conversation,
      pendingAction: nextPendingAction(view.conversation.pendingAction, action),
    },
    timeline: view.timeline.map((message) => replaceInMessage(message, action)),
  }));
}

function resultTicket(outcome: ChatTurnOutcome): TicketDetail | null {
  const card = outcome.message.parts.find((part: MessagePart) => part.type === 'ticket_card');
  return card?.type === 'ticket_card' ? card.ticket : null;
}

export type ConfirmedInput = {
  action: PendingAction;
  via: ConfirmationChannel;
  outcome: ChatTurnOutcome;
};

export function applyConfirmation(queryClient: QueryClient, input: ConfirmedInput): void {
  const { action, via, outcome } = input;
  applyActionUpdate(queryClient, {
    ...action,
    status: 'confirmed',
    confirmedVia: via,
    resolvedAt: outcome.message.createdAt,
    resultTicket: resultTicket(outcome),
  });
  updateView(queryClient, (view) => ({
    ...view,
    conversation: outcome.conversation,
    timeline: appendUnique(view.timeline, outcome.message),
  }));
}
