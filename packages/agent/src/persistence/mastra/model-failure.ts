const SERVER_ERROR_MIN_STATUS = 500;
const MODEL_FAILURE_MESSAGE = 'O modelo de linguagem não respondeu.';
const FIRST_EVENT_TIMEOUT_MESSAGE = 'O modelo não enviou o primeiro evento a tempo.';
const TURN_TIMEOUT_MESSAGE = 'O turno excedeu o tempo limite.';

export class ModelFailureError extends Error {
  constructor(
    readonly statusCode: number | undefined,
    options?: ErrorOptions,
  ) {
    super(MODEL_FAILURE_MESSAGE, options);
    this.name = 'ModelFailureError';
  }
}

export class FirstEventTimeoutError extends Error {
  constructor() {
    super(FIRST_EVENT_TIMEOUT_MESSAGE);
    this.name = 'FirstEventTimeoutError';
  }
}

export class TurnTimeoutError extends Error {
  constructor() {
    super(TURN_TIMEOUT_MESSAGE);
    this.name = 'TurnTimeoutError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function statusCodeOf(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  if (typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  return statusCodeOf(error.cause) ?? statusCodeOf(error.lastError);
}

export function toModelFailure(error: unknown): Error {
  if (error instanceof FirstEventTimeoutError || error instanceof TurnTimeoutError) {
    return error;
  }
  return new ModelFailureError(statusCodeOf(error), { cause: error });
}

export function canRetryAfterFailure(error: unknown): boolean {
  if (error instanceof FirstEventTimeoutError) {
    return true;
  }
  if (!(error instanceof ModelFailureError)) {
    return false;
  }
  return error.statusCode === undefined || error.statusCode >= SERVER_ERROR_MIN_STATUS;
}
