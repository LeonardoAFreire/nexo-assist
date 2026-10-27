import type {
  ChatMessage,
  ConsoleConversationItem,
  ConsoleLastMessage,
  UserProfile,
} from '@nexo/contracts';
import { LAST_MESSAGE_PREVIEW_MAX_LENGTH } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import { collectTicketNumbers } from '../handoff/collect-ticket-numbers.js';
import { deriveConsoleStatus } from './derive-console-status.js';

const ELLIPSIS = '…';

export type ConsoleSource = {
  conversation: Conversation;
  employee: UserProfile;
  assignedAnalyst: UserProfile | null;
  messages: readonly ChatMessage[];
};

export type ConsoleItemContext = {
  viewerId: string;
  now: Date;
};

function preview(text: string): string {
  if (text.length <= LAST_MESSAGE_PREVIEW_MAX_LENGTH) {
    return text;
  }
  return `${text.slice(0, LAST_MESSAGE_PREVIEW_MAX_LENGTH - ELLIPSIS.length)}${ELLIPSIS}`;
}

function lastMessageOf(source: ConsoleSource): ConsoleLastMessage {
  const last = source.messages.at(-1);
  if (last === undefined) {
    return { preview: '', author: 'system', at: source.conversation.props.lastMessageAt };
  }
  return { preview: preview(last.text), author: last.author, at: last.createdAt };
}

function countUnread(source: ConsoleSource): number {
  const readAt = source.conversation.props.analystReadAt;
  return source.messages.filter(
    (message) => message.author === 'employee' && (readAt === null || message.createdAt > readAt),
  ).length;
}

function ticketNumbersOf(source: ConsoleSource): string[] {
  const fromHandoff = source.conversation.props.handoff?.ticketNumbers ?? [];
  return [...new Set([...fromHandoff, ...collectTicketNumbers(source.messages)])];
}

export function buildConsoleItem(
  source: ConsoleSource,
  context: ConsoleItemContext,
): ConsoleConversationItem {
  const status = deriveConsoleStatus({
    conversation: source.conversation,
    viewerId: context.viewerId,
    assignedAnalyst: source.assignedAnalyst,
    now: context.now,
  });
  return {
    id: source.conversation.id,
    employee: source.employee,
    lastMessage: lastMessageOf(source),
    unreadCount: countUnread(source),
    consoleStatus: status.consoleStatus,
    statusDetail: status.statusDetail,
    ticketNumbers: ticketNumbersOf(source),
  };
}
