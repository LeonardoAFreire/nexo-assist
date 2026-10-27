import type { Env } from '@nexo/shared/config';
import type { AgentSettings } from '../core/agent-settings.js';
import { conservativePricing } from './model-prices.js';

export type AgentSettingsSource = { get<TKey extends keyof Env>(key: TKey): Env[TKey] };

export function buildAgentSettings(config: AgentSettingsSource): AgentSettings {
  const routerModel = config.get('LLM_ROUTER_MODEL');
  const responseModel = config.get('LLM_MODEL');
  return {
    confidenceThreshold: config.get('AGENT_CONFIDENCE_THRESHOLD'),
    dailyBudgetUsd: config.get('LLM_DAILY_BUDGET_USD'),
    routerModel,
    responseModel,
    pricing: conservativePricing([routerModel, responseModel]),
  };
}
