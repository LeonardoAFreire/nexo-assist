import type { AgentTurnEvent, AgentTurnInput, KnowledgeApi, TicketsApi } from '@nexo/contracts';
import { AgentService } from '../src/core/agent-service.js';
import type { AgentSettings } from '../src/core/agent-settings.js';
import type { LlmClient } from '../src/core/llm-client.js';
import { SystemClock } from '../src/core/system-clock.js';
import { createToolRegistry } from '../src/core/tool-registry.js';
import { InMemoryAgentRunRepository } from '../src/persistence/scripted/in-memory-agent-run-repository.js';
import type { EvalScenario } from './types.js';

export type EvalApis = { tickets: TicketsApi; knowledge: KnowledgeApi };

export type EvalAgent = {
  respond(input: AgentTurnInput): AsyncIterable<AgentTurnEvent>;
  runs: InMemoryAgentRunRepository;
};

export type AgentProvider = (scenario: EvalScenario, apis: EvalApis) => EvalAgent;

export type AgentParts = {
  llm: LlmClient;
  settings: AgentSettings;
  apis: EvalApis;
};

export function composeAgent(parts: AgentParts): EvalAgent {
  const runs = new InMemoryAgentRunRepository();
  const service = new AgentService({
    llm: parts.llm,
    runs,
    clock: new SystemClock(),
    tools: createToolRegistry(parts.apis),
    settings: parts.settings,
  });
  return { respond: (input) => service.respond(input), runs };
}
