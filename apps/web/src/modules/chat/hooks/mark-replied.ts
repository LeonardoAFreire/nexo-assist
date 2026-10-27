import type {
  ChatMessage,
  ChatStreamEvent,
  MessagePart,
  SendMessageRequest,
} from '@nexo/contracts';
import type { QueryClient } from '@tanstack/react-query';
import { updateView } from './conversation-cache.js';

function markPart(part: MessagePart, request: SendMessageRequest): MessagePart {
  if (part.type === 'quick_options' && request.quickReply) {
    return { ...part, answered: true };
  }
  if (part.type === 'ticket_selection' && request.ticketSelection) {
    return { ...part, selectedNumber: request.ticketSelection.number };
  }
  return part;
}

function markMessage(message: ChatMessage, request: SendMessageRequest): ChatMessage {
  const targetId = request.quickReply?.messageId ?? request.ticketSelection?.messageId;
  if (message.id !== targetId) {
    return message;
  }
  return { ...message, parts: message.parts.map((part) => markPart(part, request)) };
}

export function markReplied(queryClient: QueryClient, request: SendMessageRequest): void {
  updateView(queryClient, (view) => ({
    ...view,
    timeline: view.timeline.map((message) => markMessage(message, request)),
  }));
}

export async function* afterAccepted(
  stream: AsyncGenerator<ChatStreamEvent>,
  onAccepted: () => void,
): AsyncGenerator<ChatStreamEvent> {
  for await (const event of stream) {
    if (event.event === 'message.accepted') {
      onAccepted();
    }
    yield event;
  }
}
