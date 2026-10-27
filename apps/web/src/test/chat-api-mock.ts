import type { ChatStreamEvent, EmployeeConversationView } from '@nexo/contracts';
import { HttpResponse, http as mswHttp, type HttpHandler } from 'msw';
import { makeConversationView } from './chat-factories';
import { apiUrl } from './server';

export type ControlledStream = {
  response: Response;
  push: (event: ChatStreamEvent) => void;
  close: () => void;
};

function encodeEvent(event: ChatStreamEvent): Uint8Array {
  const frame = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
  return new TextEncoder().encode(frame);
}

export function controlledStream(): ControlledStream {
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  const body = new ReadableStream<Uint8Array>({ start: (started) => (controller = started) });
  const response = new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } });
  return {
    response,
    push: (event: ChatStreamEvent) => controller?.enqueue(encodeEvent(event)),
    close: () => controller?.close(),
  };
}

export function currentConversationMock(
  view: EmployeeConversationView = makeConversationView(),
): HttpHandler {
  return mswHttp.get(apiUrl('/conversations/current'), () => HttpResponse.json(view));
}

export function completedStream(events: ChatStreamEvent[]): Response {
  const stream = controlledStream();
  events.forEach((event: ChatStreamEvent) => stream.push(event));
  stream.close();
  return stream.response;
}
