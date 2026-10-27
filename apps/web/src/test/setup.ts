import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { EventSource } from 'eventsource';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './server';

globalThis.EventSource = EventSource;

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverStub;

configure({ asyncUtilTimeout: 4000 });

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
