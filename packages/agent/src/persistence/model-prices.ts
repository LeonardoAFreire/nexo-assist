import { DEFAULT_TOKEN_PRICING, type TokenPricing } from '../core/agent-settings.js';

export const MODEL_PRICES: Readonly<Record<string, TokenPricing>> = {
  'deepseek/deepseek-v4-flash': { inputPerMillionUsd: 0.05, outputPerMillionUsd: 0.45 },
  'deepseek/deepseek-v4-flash-0731': { inputPerMillionUsd: 0.12, outputPerMillionUsd: 0.24 },
  'qwen/qwen3.8-flash': { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.47 },
  'qwen/qwen3.7-flash': { inputPerMillionUsd: 0.03, outputPerMillionUsd: 0.13 },
  'z-ai/glm-5.3-flash': { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.5 },
  'google/gemini-2.5-flash-lite': { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.4 },
  'google/gemini-2.5-flash': { inputPerMillionUsd: 0.3, outputPerMillionUsd: 2.5 },
  'openai/gpt-4o-mini': { inputPerMillionUsd: 0.15, outputPerMillionUsd: 0.6 },
  'openai/gpt-4o': { inputPerMillionUsd: 2.5, outputPerMillionUsd: 10 },
  'openai/gpt-4.1-nano': { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.4 },
  'openai/gpt-4.1-mini': { inputPerMillionUsd: 0.4, outputPerMillionUsd: 1.6 },
  'openai/gpt-4.1': { inputPerMillionUsd: 2, outputPerMillionUsd: 8 },
  'google/gemini-2.0-flash-001': { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.4 },
  'anthropic/claude-3.5-haiku': { inputPerMillionUsd: 0.8, outputPerMillionUsd: 4 },
  'anthropic/claude-haiku-5.5': { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.5 },
  'inception/mercury-2.5': { inputPerMillionUsd: 0.04, outputPerMillionUsd: 0.15 },
  'openai/gpt-6-luna': { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.5 },
};

export function pricingFor(model: string): TokenPricing {
  return MODEL_PRICES[model] ?? DEFAULT_TOKEN_PRICING;
}

export function conservativePricing(models: string[]): TokenPricing {
  const prices = models.map(pricingFor);
  return {
    inputPerMillionUsd: Math.max(...prices.map((price) => price.inputPerMillionUsd)),
    outputPerMillionUsd: Math.max(...prices.map((price) => price.outputPerMillionUsd)),
  };
}
