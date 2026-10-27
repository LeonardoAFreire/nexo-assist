import type { ChatStreamEvent } from '@nexo/contracts';
import { streamChatEvents } from './chat-stream.js';

export function retryTurn(signal: AbortSignal): AsyncGenerator<ChatStreamEvent> {
  return streamChatEvents({ path: '/conversations/current/turns/retry', body: {}, signal });
}
