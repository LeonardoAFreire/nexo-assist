import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AttemptTimeoutError } from './attempt-timeout.error.js';
import type { AttemptFailure, ResiliencePolicy } from './resilience-policy.js';
import { withResilience } from './with-resilience.js';

const FIRST_DELAY_MS = 300;
const SECOND_DELAY_MS = 900;

function makePolicy(overrides: Partial<ResiliencePolicy> = {}): ResiliencePolicy {
  return {
    attempts: 3,
    timeoutMs: 2000,
    baseDelayMs: FIRST_DELAY_MS,
    backoffFactor: 3,
    ...overrides,
  };
}

describe('withResilience', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devolve o valor quando a operação falha duas vezes e funciona na terceira', async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('falha 1'))
      .mockRejectedValueOnce(new Error('falha 2'))
      .mockResolvedValueOnce('ok');
    const result = withResilience(operation, makePolicy());
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS + SECOND_DELAY_MS);
    await expect(result).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('propaga o último erro depois de esgotar as tentativas', async () => {
    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('falha 1'))
      .mockRejectedValueOnce(new Error('falha 2'))
      .mockRejectedValueOnce(new Error('falha 3'));
    const result = withResilience(operation, makePolicy());
    const assertion = expect(result).rejects.toThrow('falha 3');
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS + SECOND_DELAY_MS);
    await assertion;
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('espera de forma exponencial entre as tentativas', async () => {
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('fora'));
    const result = withResilience(operation, makePolicy());
    const assertion = expect(result).rejects.toThrow('fora');
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS - 1);
    expect(operation).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(operation).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(SECOND_DELAY_MS - 1);
    expect(operation).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(operation).toHaveBeenCalledTimes(3);
    await assertion;
  });

  it('trata como falha a tentativa que excede o timeout e aborta o sinal', async () => {
    const signals: AbortSignal[] = [];
    const operation = (signal: AbortSignal): Promise<string> => {
      signals.push(signal);
      return new Promise<string>(() => undefined);
    };
    const result = withResilience(operation, makePolicy({ attempts: 1, timeoutMs: 2000 }));
    const assertion = expect(result).rejects.toBeInstanceOf(AttemptTimeoutError);
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(signals[0]?.aborted).toBe(true);
  });

  it('informa cada falha em onAttemptFailed indicando se haverá nova tentativa', async () => {
    const failures: AttemptFailure[] = [];
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('fora'));
    const result = withResilience(
      operation,
      makePolicy({ onAttemptFailed: (failure) => failures.push(failure) }),
    );
    const assertion = expect(result).rejects.toThrow('fora');
    await vi.advanceTimersByTimeAsync(FIRST_DELAY_MS + SECOND_DELAY_MS);
    await assertion;
    expect(failures.map(({ attempt, willRetry }) => ({ attempt, willRetry }))).toEqual([
      { attempt: 1, willRetry: true },
      { attempt: 2, willRetry: true },
      { attempt: 3, willRetry: false },
    ]);
  });

  it('não chama onAttemptFailed quando a primeira tentativa funciona', async () => {
    const onAttemptFailed = vi.fn();
    const result = await withResilience(
      () => Promise.resolve('ok'),
      makePolicy({ onAttemptFailed }),
    );
    expect(result).toBe('ok');
    expect(onAttemptFailed).not.toHaveBeenCalled();
  });
});
