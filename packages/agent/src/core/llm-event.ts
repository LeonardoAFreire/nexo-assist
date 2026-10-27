import type { TokenUsage } from './token-usage.js';

export type LlmEvent =
  | { type: 'text-delta'; delta: string }
  | { type: 'finished'; usage: TokenUsage };
