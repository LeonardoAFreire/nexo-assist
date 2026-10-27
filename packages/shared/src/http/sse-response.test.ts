import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SSE_HEARTBEAT_INTERVAL_MS, SseResponse, type SseTarget } from './sse-response.js';

type FakeTarget = SseTarget & {
  headers: Record<string, string>;
  chunks: string[];
  ended: boolean;
  disconnect(): void;
};

function makeTarget(): FakeTarget {
  const closeListeners: Array<() => void> = [];
  const target: FakeTarget = {
    headers: {},
    chunks: [],
    ended: false,
    setHeader: (name, value) => {
      target.headers[name] = value;
    },
    flushHeaders: () => undefined,
    write: (chunk) => target.chunks.push(chunk),
    end: () => {
      target.ended = true;
    },
    on: (_event, listener) => closeListeners.push(listener),
    disconnect: () => closeListeners.forEach((listener) => listener()),
  };
  return target;
}

describe('SseResponse', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('define os cabeçalhos de event-stream ao abrir', () => {
    const target = makeTarget();
    new SseResponse(target).open();
    expect(target.headers['Content-Type']).toContain('text/event-stream');
    expect(target.headers['Cache-Control']).toContain('no-cache');
    expect(target.headers['Connection']).toBe('keep-alive');
  });

  it('formata o evento com event, data em JSON e linha em branco final', () => {
    const target = makeTarget();
    const sse = new SseResponse(target);
    sse.open();
    sse.send('turn.text-delta', { delta: 'Olá' });
    expect(target.chunks).toEqual(['event: turn.text-delta\ndata: {"delta":"Olá"}\n\n']);
  });

  it('envia heartbeat a cada 25 segundos', async () => {
    const target = makeTarget();
    new SseResponse(target).open();
    await vi.advanceTimersByTimeAsync(SSE_HEARTBEAT_INTERVAL_MS * 2);
    expect(target.chunks).toEqual([
      'event: heartbeat\ndata: {}\n\n',
      'event: heartbeat\ndata: {}\n\n',
    ]);
  });

  it('para o heartbeat, avisa os ouvintes e ignora envios quando o cliente desconecta', async () => {
    const target = makeTarget();
    const sse = new SseResponse(target);
    const onClose = vi.fn();
    sse.onClose(onClose);
    sse.open();
    target.disconnect();
    sse.send('turn.step', {});
    await vi.advanceTimersByTimeAsync(SSE_HEARTBEAT_INTERVAL_MS);
    expect(sse.isClosed).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(target.chunks).toEqual([]);
  });

  it('encerra a resposta uma única vez ao fechar', () => {
    const target = makeTarget();
    const sse = new SseResponse(target);
    sse.open();
    sse.close();
    target.disconnect();
    sse.close();
    expect(target.ended).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
