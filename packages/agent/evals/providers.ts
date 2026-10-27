import {
  type AgentSettingsSource,
  buildAgentSettings,
} from '../src/persistence/agent-settings.factory.js';
import { createLlmClient } from '../src/persistence/llm-client.factory.js';
import { DEFAULT_SETTINGS } from '../src/persistence/scripted/make-agent-harness.js';
import { ScriptedLlmClient } from '../src/persistence/scripted/scripted-llm-client.js';
import { type AgentProvider, composeAgent } from './compose-agent.js';

export function createLiveProvider(config: AgentSettingsSource): AgentProvider {
  const llm = createLlmClient(config);
  const settings = buildAgentSettings(config);
  return (_scenario, apis) => composeAgent({ llm, settings, apis });
}

export function createRehearsalProvider(): AgentProvider {
  return (scenario, apis) => {
    const llm = new ScriptedLlmClient(scenario.rehearsal);
    return composeAgent({ llm, settings: DEFAULT_SETTINGS, apis });
  };
}
