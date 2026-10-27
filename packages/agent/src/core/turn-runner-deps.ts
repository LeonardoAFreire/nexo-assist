import type { AgentLogger } from './agent-logger.js';
import type { AgentRunRepository } from './agent-run-repository.js';
import type { AgentSettings } from './agent-settings.js';
import type { AgentTool } from './agent-tool.js';
import type { Clock } from './clock.js';
import type { LlmClient } from './llm-client.js';

export type TurnRunnerDeps = {
  logger?: AgentLogger;
  llm: LlmClient;
  runs: AgentRunRepository;
  clock: Clock;
  tools: AgentTool[];
  settings: AgentSettings;
};
