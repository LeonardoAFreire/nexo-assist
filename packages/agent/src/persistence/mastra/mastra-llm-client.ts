import type { MastraModelConfig } from '@mastra/core/llm';
import type { Understanding } from '@nexo/contracts';
import type { LlmClient, LlmResult, RespondInput, UnderstandInput } from '../../core/llm-client.js';
import type { LlmEvent } from '../../core/llm-event.js';
import { startDeadline } from './deadline.js';
import { canRetryAfterFailure, TurnTimeoutError } from './model-failure.js';
import { respondOnce } from './respond-call.js';
import { understandOnce } from './understand-call.js';

const MAX_ATTEMPTS = 2;

export type MastraModels = {
  router: MastraModelConfig;
  response: MastraModelConfig;
};

export type MastraTimeouts = {
  firstEventMs: number;
  turnMs: number;
};

export const DEFAULT_MASTRA_TIMEOUTS: MastraTimeouts = { firstEventMs: 8000, turnMs: 25_000 };

type RetryState = { attempt: number; started: boolean };

function rethrowUnlessRetryable(error: unknown, state: RetryState): void {
  const hasAttemptsLeft = !state.started && state.attempt < MAX_ATTEMPTS;
  if (!hasAttemptsLeft || !canRetryAfterFailure(error)) {
    throw error;
  }
}

export class MastraLlmClient implements LlmClient {
  constructor(
    private readonly models: MastraModels,
    private readonly timeouts: MastraTimeouts = DEFAULT_MASTRA_TIMEOUTS,
  ) {}

  async understand(input: UnderstandInput): Promise<LlmResult<Understanding>> {
    try {
      return await understandOnce(this.models.router, input);
    } catch (error: unknown) {
      if (!canRetryAfterFailure(error)) {
        throw error;
      }
      return understandOnce(this.models.router, input);
    }
  }

  async *respond(input: RespondInput): AsyncGenerator<LlmEvent> {
    const turn = startDeadline(this.timeouts.turnMs, () => new TurnTimeoutError());
    const progress = { started: false };
    const shared = { turn, progress, firstEventTimeoutMs: this.timeouts.firstEventMs };
    try {
      for (let attempt = 1; ; attempt += 1) {
        try {
          yield* respondOnce(this.models.response, input, shared);
          return;
        } catch (error: unknown) {
          rethrowUnlessRetryable(error, { attempt, started: progress.started });
        }
      }
    } finally {
      turn.cancel();
    }
  }
}
