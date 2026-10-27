import type { ChatStreamEvent, SendMessageRequest } from '@nexo/contracts';
import { streamChatEvents } from './chat-stream.js';

export function streamMessage(
  request: SendMessageRequest,
  signal: AbortSignal,
): AsyncGenerator<ChatStreamEvent> {
  return streamChatEvents({ path: '/conversations/current/messages', body: request, signal });
}
