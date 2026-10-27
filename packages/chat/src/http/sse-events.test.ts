import { SSE_HEARTBEAT_INTERVAL_MS } from '@nexo/shared/http';
import { NEVER } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toMessageEvent, withHeartbeat } from './sse-events.js';

describe('withHeartbeat', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emite heartbeat a cada 25 segundos sem esperar eventos', () => {
    const received: unknown[] = [];
    const subscription = withHeartbeat(NEVER).subscribe((event) => received.push(event));
    vi.advanceTimersByTime(SSE_HEARTBEAT_INTERVAL_MS - 1);
    expect(received).toHaveLength(0);
    vi.advanceTimersByTime(1);
    vi.advanceTimersByTime(SSE_HEARTBEAT_INTERVAL_MS);
    subscription.unsubscribe();
    expect(SSE_HEARTBEAT_INTERVAL_MS).toBe(25_000);
    expect(received).toEqual([
      { type: 'heartbeat', data: {} },
      { type: 'heartbeat', data: {} },
    ]);
  });

  it('para de emitir depois que a inscrição é cancelada', () => {
    const received: unknown[] = [];
    withHeartbeat(NEVER)
      .subscribe((event) => received.push(event))
      .unsubscribe();
    vi.advanceTimersByTime(SSE_HEARTBEAT_INTERVAL_MS * 2);
    expect(received).toHaveLength(0);
  });
});

describe('toMessageEvent', () => {
  it('usa o nome do evento como tipo do SSE', () => {
    const payload = { event: 'message.created', data: { message: { id: 'm1' } } };
    expect(toMessageEvent(payload)).toEqual({ type: 'message.created', data: payload.data });
  });
});
