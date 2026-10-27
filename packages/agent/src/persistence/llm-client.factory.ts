import type { MastraModelConfig } from '@mastra/core/llm';
import { createOpenRouter, type OpenRouterProvider } from '@openrouter/ai-sdk-provider';
import type { LlmClient } from '../core/llm-client.js';
import type { AgentSettingsSource } from './agent-settings.factory.js';
import { MastraLlmClient } from './mastra/mastra-llm-client.js';
import { ScriptedLlmClient } from './scripted/scripted-llm-client.js';

const MISSING_API_KEY_MESSAGE = 'OPENROUTER_API_KEY não configurada';

function chatModel(provider: OpenRouterProvider, modelId: string): MastraModelConfig {
  return provider.chat(modelId) as unknown as MastraModelConfig;
}

export function createLlmClient(config: AgentSettingsSource): LlmClient {
  if (config.get('LLM_PROVIDER') === 'scripted') {
    return new ScriptedLlmClient([]);
  }
  const apiKey = config.get('OPENROUTER_API_KEY');
  if (apiKey === undefined) {
    throw new Error(MISSING_API_KEY_MESSAGE);
  }
  const provider = createOpenRouter({ apiKey });
  return new MastraLlmClient({
    router: chatModel(provider, config.get('LLM_ROUTER_MODEL')),
    response: chatModel(provider, config.get('LLM_MODEL')),
  });
}
