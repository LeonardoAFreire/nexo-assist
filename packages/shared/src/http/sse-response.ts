export const SSE_HEARTBEAT_INTERVAL_MS = 25_000;
const HEARTBEAT_EVENT = 'heartbeat';

const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

export type SseTarget = {
  setHeader(name: string, value: string): unknown;
  flushHeaders(): void;
  write(chunk: string): unknown;
  end(): unknown;
  on(event: 'close', listener: () => void): unknown;
};

export class SseResponse {
  private heartbeat: ReturnType<typeof setInterval> | undefined;
  private closed = false;
  private readonly closeListeners: Array<() => void> = [];

  constructor(private readonly target: SseTarget) {}

  get isClosed(): boolean {
    return this.closed;
  }

  open(): void {
    for (const [name, value] of Object.entries(SSE_HEADERS)) {
      this.target.setHeader(name, value);
    }
    this.target.flushHeaders();
    this.target.on('close', () => this.markClosed());
    this.heartbeat = setInterval(() => this.send(HEARTBEAT_EVENT, {}), SSE_HEARTBEAT_INTERVAL_MS);
  }

  send(event: string, data: unknown): void {
    if (this.closed) {
      return;
    }
    this.target.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  onClose(listener: () => void): void {
    this.closeListeners.push(listener);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.markClosed();
    this.target.end();
  }

  private markClosed(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    clearInterval(this.heartbeat);
    this.closeListeners.forEach((listener) => listener());
  }
}
