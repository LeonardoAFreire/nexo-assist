import type { ConversationStreamEvent } from '@nexo/contracts';
import { type HttpHandler, sse } from 'msw';
import { apiUrl } from './server';

type ConversationEventName = ConversationStreamEvent['event'];

type StreamClient = {
  send: (payload: { event: ConversationEventName; data: unknown }) => void;
};

export type ConversationEventsBackend = {
  client: StreamClient | null;
  handler: HttpHandler;
  emit: (event: ConversationStreamEvent) => void;
};

export function conversationEventsMock(): ConversationEventsBackend {
  const backend: ConversationEventsBackend = {
    client: null,
    handler: sse<Record<ConversationEventName, unknown>>(
      apiUrl('/conversations/current/events'),
      ({ client }) => {
        backend.client = client;
      },
    ),
    emit: (event: ConversationStreamEvent) => {
      backend.client?.send({ event: event.event, data: event.data });
    },
  };
  return backend;
}
