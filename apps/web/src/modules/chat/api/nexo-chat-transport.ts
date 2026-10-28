import {
  type ChatStreamEvent,
  type SendMessageRequest,
  sendMessageRequestSchema,
} from '@nexo/contracts';
import type { ChatRequestOptions, ChatTransport, UIMessageChunk } from 'ai';
import type { NexoUIMessage } from '../types/nexo-ui-message.js';
import { retryTurn } from './retry-turn.js';
import { streamMessage } from './stream-message.js';
import { toChunks } from './stream-chunks.js';

type SendOptions = Parameters<ChatTransport<NexoUIMessage>['sendMessages']>[0];

function messageText(message: NexoUIMessage): string {
  return message.parts.map((part) => (part.type === 'text' ? part.text : '')).join('');
}

export function toSendRequest(
  messages: NexoUIMessage[],
  body: ChatRequestOptions['body'],
): SendMessageRequest {
  const last = messages.findLast((message: NexoUIMessage) => message.role === 'user');
  if (last === undefined) {
    throw new Error('Nenhuma mensagem do funcionário para enviar.');
  }
  return sendMessageRequestSchema.parse({
    ...body,
    clientMessageId: last.id,
    text: messageText(last),
  });
}

function toReadableStream(source: AsyncGenerator<UIMessageChunk>): ReadableStream<UIMessageChunk> {
  return new ReadableStream<UIMessageChunk>({
    async pull(controller) {
      const next = await source.next();
      if (next.done) {
        controller.close();
        return;
      }
      controller.enqueue(next.value);
    },
    async cancel() {
      await source.return(undefined);
    },
  });
}

function openEvents(options: SendOptions, signal: AbortSignal): AsyncGenerator<ChatStreamEvent> {
  if (options.trigger === 'regenerate-message') {
    return retryTurn(signal);
  }
  return streamMessage(toSendRequest(options.messages, options.body), signal);
}

export class NexoChatTransport implements ChatTransport<NexoUIMessage> {
  sendMessages(options: SendOptions): Promise<ReadableStream<UIMessageChunk>> {
    const signal = options.abortSignal ?? new AbortController().signal;
    const events = openEvents(options, signal);
    return Promise.resolve(toReadableStream(toChunks(events)));
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    return Promise.resolve(null);
  }
}
