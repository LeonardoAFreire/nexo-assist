import { type ConversationStreamEvent, conversationStreamEventSchema } from '@nexo/contracts';
import { http } from '@/lib/http';

const EVENTS_PATH = '/conversations/current/events';
const EVENT_NAMES = ['conversation.updated', 'message.created'] as const;

export type ConversationEventsOptions = {
  onEvent: (event: ConversationStreamEvent) => void;
  onReconnect: () => void;
};

function parseEvent(name: string, raw: unknown): ConversationStreamEvent | null {
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const parsed = conversationStreamEventSchema.safeParse({ event: name, data: JSON.parse(raw) });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function subscribeConversation(options: ConversationEventsOptions): () => void {
  const source = new EventSource(http.getUri({ url: EVENTS_PATH }), { withCredentials: true });
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
