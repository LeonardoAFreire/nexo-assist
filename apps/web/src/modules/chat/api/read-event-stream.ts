import { createParser, type EventSourceMessage } from 'eventsource-parser';

export async function* readEventStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<EventSourceMessage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const queue: EventSourceMessage[] = [];
  const parser = createParser({ onEvent: (message: EventSourceMessage) => queue.push(message) });
  try {
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
      parser.feed(decoder.decode(chunk.value, { stream: true }));
      yield* queue.splice(0);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}
