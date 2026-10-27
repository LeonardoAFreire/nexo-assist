import type { ResiliencePolicy } from './resilience-policy.js';
import { type Operation, runAttempt } from './run-attempt.js';

function waitFor(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

function delayBeforeRetry(policy: ResiliencePolicy, failedAttempt: number): number {
  return policy.baseDelayMs * policy.backoffFactor ** (failedAttempt - 1);
}

export async function withResilience<T>(
  operation: Operation<T>,
  policy: ResiliencePolicy,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await runAttempt(operation, policy.timeoutMs);
    } catch (error: unknown) {
      const willRetry = attempt < policy.attempts;
      policy.onAttemptFailed?.({ attempt, error, willRetry });
      if (!willRetry) {
        throw error;
      }
      await waitFor(delayBeforeRetry(policy, attempt));
    }
  }
}
