import type {
  ChatMessage,
  ChatTurnOutcome,
  ConfirmationChannel,
  MessagePart,
  PendingAction,
  TicketDetail,
} from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import type { TimelineUpdater } from '../types/nexo-ui-message.js';
import { updateView } from './conversation-cache.js';
import { appendUnique } from './ui-messages.js';

export type ActionCacheTargets = {
  queryClient: QueryClient;
  updateTimeline: TimelineUpdater;
};

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

export function applyActionUpdate(targets: ActionCacheTargets, action: PendingAction): void {
  updateView(targets.queryClient, (view) => ({
    ...view,
    conversation: view.conversation && {
      ...view.conversation,
      pendingAction: nextPendingAction(view.conversation.pendingAction, action),
    },
  }));
  targets.updateTimeline((timeline) =>
    timeline.map((message) => replaceInMessage(message, action)),
  );
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

export function applyConfirmation(targets: ActionCacheTargets, input: ConfirmedInput): void {
  const { action, via, outcome } = input;
  applyActionUpdate(targets, {
    ...action,
    status: 'confirmed',
    confirmedVia: via,
    resolvedAt: outcome.message.createdAt,
    resultTicket: resultTicket(outcome),
  });
  updateView(targets.queryClient, (view) => ({ ...view, conversation: outcome.conversation }));
  targets.updateTimeline((timeline) => appendUnique(timeline, outcome.message));
}
