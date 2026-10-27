import type { AgentTurnEvent, AgentTurnInput, KnowledgeApi, TicketsApi } from '@nexo/contracts';
import type { AgentLogger } from '../../core/agent-logger.js';
import { AgentService } from '../../core/agent-service.js';
import { DEFAULT_TOKEN_PRICING, type AgentSettings } from '../../core/agent-settings.js';
import { createToolRegistry } from '../../core/tool-registry.js';
import { FakeClock } from './fake-clock.js';
import { InMemoryAgentRunRepository } from './in-memory-agent-run-repository.js';
import { InMemoryKnowledgeApi } from './in-memory-knowledge-api.js';
import { InMemoryTicketsApi } from './in-memory-tickets-api.js';
import { makeAgentTurnInput } from './make-agent-turn-input.js';
import { ScriptedLlmClient, type ScriptedEntry } from './scripted-llm-client.js';

export const DEFAULT_SETTINGS: AgentSettings = {
  confidenceThreshold: 0.6,
  dailyBudgetUsd: 2,
  routerModel: 'router-model',
  responseModel: 'response-model',
  pricing: DEFAULT_TOKEN_PRICING,
};

export type AgentHarnessOptions = {
  script: ScriptedEntry[];
  llm?: ScriptedLlmClient;
  tickets?: TicketsApi;
  knowledge?: KnowledgeApi;
  runs?: InMemoryAgentRunRepository;
  settings?: Partial<AgentSettings>;
  logger?: AgentLogger;
};

export function makeAgentHarness(options: AgentHarnessOptions) {
  const llm = options.llm ?? new ScriptedLlmClient(options.script);
  const runs = options.runs ?? new InMemoryAgentRunRepository();
  const clock = new FakeClock();
  const tickets = options.tickets ?? new InMemoryTicketsApi([]);
  const knowledge = options.knowledge ?? new InMemoryKnowledgeApi([]);
  const settings = { ...DEFAULT_SETTINGS, ...options.settings };
  const tools = createToolRegistry({ tickets, knowledge });
  const service = new AgentService({ llm, runs, clock, tools, settings, logger: options.logger });

  async function collect(overrides: Partial<AgentTurnInput> = {}): Promise<AgentTurnEvent[]> {
    const events: AgentTurnEvent[] = [];
    for await (const event of service.respond(makeAgentTurnInput(overrides))) {
      events.push(event);
    }
    return events;
  }

  return { llm, runs, clock, collect };
}
