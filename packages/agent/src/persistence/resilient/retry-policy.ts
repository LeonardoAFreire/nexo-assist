import type { ResiliencePolicy } from '@nexo/shared/resilience';

const LEGACY_ATTEMPTS = 3;
const LEGACY_ATTEMPT_TIMEOUT_MS = 2000;
const LEGACY_FIRST_DELAY_MS = 300;
const LEGACY_BACKOFF_FACTOR = 3;

export type BasePolicy = Omit<ResiliencePolicy, 'onAttemptFailed'>;

export const LEGACY_RETRY_POLICY: BasePolicy = {
  attempts: LEGACY_ATTEMPTS,
  timeoutMs: LEGACY_ATTEMPT_TIMEOUT_MS,
  baseDelayMs: LEGACY_FIRST_DELAY_MS,
  backoffFactor: LEGACY_BACKOFF_FACTOR,
};
