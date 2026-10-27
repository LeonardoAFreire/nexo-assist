export type AttemptFailure = {
  attempt: number;
  error: unknown;
  willRetry: boolean;
};

export type ResiliencePolicy = {
  attempts: number;
  timeoutMs: number;
  baseDelayMs: number;
  backoffFactor: number;
  onAttemptFailed?: (failure: AttemptFailure) => void;
};
