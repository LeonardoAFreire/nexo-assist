import { type ChatStreamEvent, chatStreamEventSchema } from '@nexo/contracts';
import type { EventSourceMessage } from 'eventsource-parser';

export function parseStreamEvent(message: EventSourceMessage): ChatStreamEvent | null {
  const parsed = chatStreamEventSchema.safeParse({
    event: message.event,
    data: JSON.parse(message.data) as unknown,
  });
  return parsed.success ? parsed.data : null;
}
