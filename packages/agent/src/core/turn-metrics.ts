import type { TokenPricing } from './agent-settings.js';
import { estimateCostUsd } from './cost-estimator.js';
import type { TokenUsage } from './token-usage.js';

export type MetricsSnapshot = {
  models: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export class TurnMetrics {
  private readonly models = new Set<string>();
  private inputTokens = 0;
  private outputTokens = 0;
  private costUsd = 0;

  constructor(private readonly pricing: TokenPricing) {}

  add(model: string, usage: TokenUsage): void {
    this.models.add(model);
    this.inputTokens += usage.inputTokens;
    this.outputTokens += usage.outputTokens;
    this.costUsd += estimateCostUsd(usage, this.pricing);
  }

  snapshot(): MetricsSnapshot {
    return {
      models: [...this.models],
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      costUsd: this.costUsd,
    };
  }
}
