import { AsyncLocalStorage } from 'node:async_hooks';
import type { AttemptFailure } from '@nexo/shared/resilience';

export type AttemptObserver = (failure: AttemptFailure) => void;

const observers = new AsyncLocalStorage<AttemptObserver>();

export function runWithAttemptObserver<T>(
  observer: AttemptObserver,
  operation: () => Promise<T>,
): Promise<T> {
  return observers.run(observer, operation);
}

export function reportFailedAttempt(failure: AttemptFailure): void {
  observers.getStore()?.(failure);
}
