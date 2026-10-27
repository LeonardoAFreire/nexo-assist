import type { LlmEvent } from '../../core/llm-event.js';
import type { TokenUsage } from '../../core/token-usage.js';
import type { Deadline } from './deadline.js';
import { toModelFailure } from './model-failure.js';
import { type ParsedChunk, parseChunk } from './parse-chunk.js';
import { StepTextSeparator } from './step-text-separator.js';
import type { ToolBridge } from './tool-bridge.js';

const NO_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0 };

export type StreamProgress = { started: boolean };

export type StreamGuards = {
  turn: Deadline;
  first: Deadline;
  bridge: ToolBridge;
  progress: StreamProgress;
  callerSignal: AbortSignal;
};

function throwIfInterrupted(guards: StreamGuards): void {
  if (guards.bridge.fatal !== null) {
    throw guards.bridge.fatal.error;
  }
  if (guards.callerSignal.aborted) {
    throw guards.callerSignal.reason;
  }
}

async function nextChunk(
  iterator: AsyncIterator<unknown>,
  guards: StreamGuards,
): Promise<IteratorResult<unknown>> {
  try {
    const next = await Promise.race([iterator.next(), guards.turn.expired, guards.first.expired]);
    throwIfInterrupted(guards);
    return next;
  } catch (error: unknown) {
    throwIfInterrupted(guards);
    throw toModelFailure(error);
  }
}

function trackProgress(chunk: ParsedChunk, guards: StreamGuards): void {
  if (chunk.kind === 'error') {
    throw toModelFailure(chunk.error);
  }
  if (chunk.kind === 'text' || chunk.kind === 'tool-call') {
    guards.progress.started = true;
    guards.first.cancel();
  }
}

export async function* readResponseStream(
  source: AsyncIterable<unknown>,
  guards: StreamGuards,
): AsyncGenerator<LlmEvent> {
  const iterator = source[Symbol.asyncIterator]();
  let usage = NO_USAGE;
  const separator = new StepTextSeparator();
  try {
    for (let next = await nextChunk(iterator, guards); next.done !== true;) {
      const chunk = parseChunk(next.value);
      trackProgress(chunk, guards);
      usage = chunk.kind === 'finish' ? chunk.usage : usage;
      if (chunk.kind === 'tool-call') {
        separator.noteToolCall();
      }
      if (chunk.kind === 'text') {
        yield { type: 'text-delta', delta: separator.apply(chunk.delta) };
      }
      next = await nextChunk(iterator, guards);
    }
  } finally {
    iterator.return?.()?.catch(() => undefined);
  }
  yield { type: 'finished', usage };
}
