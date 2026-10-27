import { type ConsoleStreamEvent, consoleStreamEventSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

const EVENTS_PATH = '/console/events';
const EVENT_NAMES = ['console.item.updated', 'conversation.updated', 'message.created'] as const;

export type ConsoleEventsOptions = {
  conversationId: string | undefined;
  onEvent: (event: ConsoleStreamEvent) => void;
  onReconnect: () => void;
};

function parseEvent(name: string, raw: unknown): ConsoleStreamEvent | null {
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const parsed = consoleStreamEventSchema.safeParse({ event: name, data: JSON.parse(raw) });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function subscribeConsoleEvents(options: ConsoleEventsOptions): () => void {
  const url = http.getUri({ url: EVENTS_PATH, params: { conversationId: options.conversationId } });
  const source = new EventSource(url, { withCredentials: true });
  let dropped = false;
  source.onerror = () => {
    dropped = true;
  };
  source.onopen = () => {
    if (dropped) {
      dropped = false;
      options.onReconnect();
    }
  };
  EVENT_NAMES.forEach((name: string) => {
    source.addEventListener(name, (message: Event) => {
      const event = parseEvent(name, (message as MessageEvent).data);
      if (event) {
        options.onEvent(event);
      }
    });
  });
  return () => source.close();
}
