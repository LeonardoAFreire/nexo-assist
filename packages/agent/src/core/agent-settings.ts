export type TokenPricing = {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
};

export type AgentSettings = {
  confidenceThreshold: number;
  dailyBudgetUsd: number;
  routerModel: string;
  responseModel: string;
  pricing: TokenPricing;
};

export const DEFAULT_TOKEN_PRICING: TokenPricing = {
  inputPerMillionUsd: 0.15,
  outputPerMillionUsd: 0.6,
};
