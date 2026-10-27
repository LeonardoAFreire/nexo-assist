import { TEST_WEB_ORIGIN, type ChatTestApp } from './chat-test-app.js';

export type SseEvent = { event: string; data: Record<string, unknown> };

export type CallOptions = {
  cookie?: string;
  body?: unknown;
  origin?: string | null;
};

export type ChatHttpClient = {
  call(method: string, path: string, options?: CallOptions): Promise<Response>;
  stream(path: string, options?: CallOptions): Promise<SseEvent[]>;
  send(text: string, extra?: Record<string, unknown>): Promise<SseEvent[]>;
  json<T>(method: string, path: string, body?: unknown): Promise<{ status: number; body: T }>;
};

export function parseSse(raw: string): SseEvent[] {
  return raw
    .split('\n\n')
    .filter((block) => block.trim() !== '')
    .map((block) => {
      const lines = block.split('\n');
      const event = lines.find((line) => line.startsWith('event: '))?.slice('event: '.length);
      const data = lines.find((line) => line.startsWith('data: '))?.slice('data: '.length);
      return { event: event ?? '', data: JSON.parse(data ?? '{}') as Record<string, unknown> };
    });
}

export function chatClient(app: ChatTestApp, cookie: string): ChatHttpClient {
  const call: ChatHttpClient['call'] = (method, path, options = {}) => {
    const origin = options.origin === undefined ? TEST_WEB_ORIGIN : options.origin;
    return fetch(`${app.baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        cookie: options.cookie ?? cookie,
        ...(origin === null ? {} : { origin }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  };
  const stream: ChatHttpClient['stream'] = async (path, options) => {
    const response = await call('POST', path, options);
    return parseSse(await response.text());
  };
  return {
    call,
    stream,
    send: (text, extra = {}) =>
      stream('/conversations/current/messages', { body: { text, ...extra } }),
    json: async <T>(method: string, path: string, body?: unknown) => {
      const response = await call(method, path, { body });
      return { status: response.status, body: (await response.json()) as T };
    },
  };
}
