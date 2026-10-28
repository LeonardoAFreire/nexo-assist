import type { ChatMessage, MessagePart } from '@nexo/contracts';
import type { ReplyRequest, TimelineUpdate } from '../types/nexo-ui-message.js';

function markPart(part: MessagePart, request: ReplyRequest): MessagePart {
  if (part.type === 'quick_options' && request.quickReply) {
    return { ...part, answered: true };
  }
  if (part.type === 'ticket_selection' && request.ticketSelection) {
    return { ...part, selectedNumber: request.ticketSelection.number };
  }
  return part;
}

function markMessage(message: ChatMessage, request: ReplyRequest): ChatMessage {
  const targetId = request.quickReply?.messageId ?? request.ticketSelection?.messageId;
  if (message.id !== targetId) {
    return message;
  }
  return { ...message, parts: message.parts.map((part) => markPart(part, request)) };
}

export function markReplied(request: ReplyRequest): TimelineUpdate {
  return (timeline: ChatMessage[]) => timeline.map((message) => markMessage(message, request));
}
