import type { TokenPricing } from './agent-settings.js';
import type { TokenUsage } from './token-usage.js';

const TOKENS_PER_MILLION = 1_000_000;

export function estimateCostUsd(usage: TokenUsage, pricing: TokenPricing): number {
  const input = usage.inputTokens * pricing.inputPerMillionUsd;
  const output = usage.outputTokens * pricing.outputPerMillionUsd;
  return (input + output) / TOKENS_PER_MILLION;
}
