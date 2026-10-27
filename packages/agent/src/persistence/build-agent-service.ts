import type { KnowledgeApi, TicketsApi } from '@nexo/contracts';
import type { Database } from '@nexo/shared/database';
import type { AgentLogger } from '../core/agent-logger.js';
import { AgentService } from '../core/agent-service.js';
import { SystemClock } from '../core/system-clock.js';
import { createToolRegistry } from '../core/tool-registry.js';
import { buildAgentSettings, type AgentSettingsSource } from './agent-settings.factory.js';
import { DrizzleAgentRunRepository } from './drizzle-agent-run.repository.js';
import { createLlmClient } from './llm-client.factory.js';
import { LoggedAgentRunRepository } from './logged-agent-run.repository.js';
import { ResilientKnowledgeApi } from './resilient/resilient-knowledge-api.js';
import { ResilientTicketsApi } from './resilient/resilient-tickets-api.js';

export type AgentServiceDeps = {
  config: AgentSettingsSource;
  database: Database;
  tickets: TicketsApi;
  knowledge: KnowledgeApi;
  logger: AgentLogger;
};

export function buildAgentService(deps: AgentServiceDeps): AgentService {
  const { config, logger } = deps;
  const tickets = new ResilientTicketsApi(deps.tickets, { logger });
  const knowledge = new ResilientKnowledgeApi(deps.knowledge, { logger });
  const runs = new LoggedAgentRunRepository(new DrizzleAgentRunRepository(deps.database), logger);
  return new AgentService({
    llm: createLlmClient(config),
    runs,
    clock: new SystemClock(),
    tools: createToolRegistry({ tickets, knowledge }),
    settings: buildAgentSettings(config),
    logger,
  });
}
