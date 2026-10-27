import type { ResiliencePolicy } from '@nexo/shared/resilience';

const TICKETS_ATTEMPTS = 3;
const TICKETS_TIMEOUT_MS = 2000;
const TICKETS_BASE_DELAY_MS = 300;
const TICKETS_BACKOFF_FACTOR = 3;

export const TICKETS_RESILIENCE_POLICY: ResiliencePolicy = {
  attempts: TICKETS_ATTEMPTS,
  timeoutMs: TICKETS_TIMEOUT_MS,
  baseDelayMs: TICKETS_BASE_DELAY_MS,
  backoffFactor: TICKETS_BACKOFF_FACTOR,
};
