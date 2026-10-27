import { type AttemptFailure, AttemptTimeoutError, withResilience } from '@nexo/shared/resilience';
import type { AgentLogger } from '../../core/agent-logger.js';
import { reportFailedAttempt } from '../../core/attempt-scope.js';
import { type BasePolicy, LEGACY_RETRY_POLICY } from './retry-policy.js';

type Settled<T> = { value: T } | { permanent: unknown };

type FailureReport = { operation: string; startedAt: number; failure: AttemptFailure };

export type ResilientExecutorOptions = {
  service: string;
  isTransient: (error: unknown) => boolean;
  toUnavailable: (cause: unknown) => Error;
  logger?: AgentLogger;
  policy?: BasePolicy;
};

export class ResilientExecutor {
  private readonly policy: BasePolicy;

  constructor(private readonly options: ResilientExecutorOptions) {
    this.policy = options.policy ?? LEGACY_RETRY_POLICY;
  }

  async run<T>(operation: string, call: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    const onAttemptFailed = (failure: AttemptFailure): void =>
      this.handleFailure({ operation, startedAt, failure });
    let settled: Settled<T>;
    try {
      settled = await withResilience(() => this.settle(call), { ...this.policy, onAttemptFailed });
    } catch (error: unknown) {
      throw this.options.toUnavailable(error);
    }
    if ('permanent' in settled) {
      throw settled.permanent;
    }
    return settled.value;
  }

  private async settle<T>(call: () => Promise<T>): Promise<Settled<T>> {
    try {
      return { value: await call() };
    } catch (error: unknown) {
      if (error instanceof AttemptTimeoutError || this.options.isTransient(error)) {
        throw error;
      }
      return { permanent: error };
    }
  }

  private handleFailure(report: FailureReport): void {
    const { operation, startedAt, failure } = report;
    reportFailedAttempt(failure);
    if (!failure.willRetry) {
      return;
    }
    const fields = { operation, attempt: failure.attempt, elapsedMs: Date.now() - startedAt };
    this.options.logger?.warn(fields, `nova tentativa no ${this.options.service}`);
  }
}
