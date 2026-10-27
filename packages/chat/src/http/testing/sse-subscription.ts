import { parseSse, type SseEvent } from './chat-http-client.js';

const WAIT_TIMEOUT_MS = 5000;
const BLOCK_SEPARATOR = '\n\n';

type EventPredicate = (event: SseEvent) => boolean;

export type SseSubscription = {
  events: SseEvent[];
  status: number;
  waitFor(predicate: EventPredicate): Promise<SseEvent>;
  close(): void;
};

type Waiter = { predicate: EventPredicate; resolve: (event: SseEvent) => void };

async function pump(
  body: ReadableStream<Uint8Array>,
  onEvents: (events: SseEvent[]) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffered = '';
  for await (const chunk of body) {
    buffered += decoder.decode(chunk, { stream: true });
    const blocks = buffered.split(BLOCK_SEPARATOR);
    buffered = blocks.pop() ?? '';
    onEvents(parseSse(blocks.join(BLOCK_SEPARATOR)).filter((event) => event.event !== ''));
  }
}

function waitForEvent(events: SseEvent[], waiters: Waiter[], predicate: EventPredicate) {
  const found = events.find(predicate);
  if (found !== undefined) {
    return Promise.resolve(found);
  }
  return new Promise<SseEvent>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Evento SSE não chegou')), WAIT_TIMEOUT_MS);
    waiters.push({
      predicate,
      resolve: (event) => {
        clearTimeout(timer);
        resolve(event);
      },
    });
  });
}

export async function openSse(
  url: string,
  headers: Record<string, string>,
): Promise<SseSubscription> {
  const controller = new AbortController();
  const response = await fetch(url, { headers, signal: controller.signal });
  const events: SseEvent[] = [];
  const waiters: Waiter[] = [];
  pump(response.body ?? new ReadableStream(), (received) => {
    events.push(...received);
    for (const waiter of waiters) {
      received.filter(waiter.predicate).slice(0, 1).forEach(waiter.resolve);
    }
  }).catch(() => undefined);
  return {
    events,
    status: response.status,
    waitFor: (predicate) => waitForEvent(events, waiters, predicate),
    close: () => controller.abort(),
  };
}
