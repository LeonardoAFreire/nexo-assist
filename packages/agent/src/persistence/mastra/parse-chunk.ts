import type { TokenUsage } from '../../core/token-usage.js';

export type ParsedChunk =
  | { kind: 'text'; delta: string }
  | { kind: 'tool-call' }
  | { kind: 'finish'; usage: TokenUsage }
  | { kind: 'error'; error: unknown }
  | { kind: 'other' };

const OTHER: ParsedChunk = { kind: 'other' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function tokenCount(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

export function toTokenUsage(usage: unknown): TokenUsage {
  if (!isRecord(usage)) {
    return { inputTokens: 0, outputTokens: 0 };
  }
  return {
    inputTokens: tokenCount(usage.inputTokens),
    outputTokens: tokenCount(usage.outputTokens),
  };
}

function parseFinish(payload: Record<string, unknown>): ParsedChunk {
  const output = isRecord(payload.output) ? payload.output : {};
  return { kind: 'finish', usage: toTokenUsage(output.usage) };
}

export function parseChunk(chunk: unknown): ParsedChunk {
  if (!isRecord(chunk) || !isRecord(chunk.payload)) {
    return OTHER;
  }
  const { payload } = chunk;
  switch (chunk.type) {
    case 'text-delta':
      return typeof payload.text === 'string' ? { kind: 'text', delta: payload.text } : OTHER;
    case 'tool-call':
      return { kind: 'tool-call' };
    case 'finish':
      return parseFinish(payload);
    case 'error':
      return { kind: 'error', error: payload.error };
    default:
      return OTHER;
  }
}
