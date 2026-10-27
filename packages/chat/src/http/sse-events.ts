import type { MessageEvent } from '@nestjs/common';
import { SSE_HEARTBEAT_INTERVAL_MS } from '@nexo/shared/http';
import { interval, map, merge, type Observable } from 'rxjs';

const HEARTBEAT_EVENT = 'heartbeat';

export type StreamPayload = {
  event: string;
  data: object;
};

export function toMessageEvent(payload: StreamPayload): MessageEvent {
  return { type: payload.event, data: payload.data };
}

export function withHeartbeat(events: Observable<MessageEvent>): Observable<MessageEvent> {
  const heartbeats = interval(SSE_HEARTBEAT_INTERVAL_MS).pipe(
    map((): MessageEvent => ({ type: HEARTBEAT_EVENT, data: {} })),
  );
  return merge(events, heartbeats);
}
