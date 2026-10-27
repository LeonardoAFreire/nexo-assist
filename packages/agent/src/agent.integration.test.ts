import { Global, Module, type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  AGENT_API,
  KNOWLEDGE_API,
  TICKETS_API,
  type AgentApi,
  type AgentTurnEvent,
} from '@nexo/contracts';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { PinoLogger } from '@nexo/shared/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AgentModule } from './agent.module.js';
import { agentRunsTable } from './persistence/agent-runs.table.js';
import { InMemoryKnowledgeApi } from './persistence/scripted/in-memory-knowledge-api.js';
import { InMemoryTicketsApi } from './persistence/scripted/in-memory-tickets-api.js';
import { makeAgentTurnInput } from './persistence/scripted/make-agent-turn-input.js';

const BASE_CONFIG: Record<string, unknown> = {
  LLM_PROVIDER: 'scripted',
  LLM_MODEL: 'openai/gpt-4o-mini',
  LLM_ROUTER_MODEL: 'openai/gpt-4o-mini',
  AGENT_CONFIDENCE_THRESHOLD: 0.6,
  LLM_DAILY_BUDGET_USD: 2,
};

function buildSupportModule(testDatabase: TestDatabase, config: Record<string, unknown>) {
  const logger = { setContext: vi.fn(), info: vi.fn(), warn: vi.fn() };
  @Global()
  @Module({
    providers: [
      { provide: DATABASE, useValue: testDatabase.database },
      { provide: AppConfig, useValue: { get: (key: string) => config[key] } },
      { provide: PinoLogger, useValue: logger },
      { provide: TICKETS_API, useValue: new InMemoryTicketsApi([]) },
      { provide: KNOWLEDGE_API, useValue: new InMemoryKnowledgeApi([]) },
    ],
    exports: [DATABASE, AppConfig, PinoLogger, TICKETS_API, KNOWLEDGE_API],
  })
  class SupportModule {}
  return SupportModule;
}

async function startApp(testDatabase: TestDatabase, config = BASE_CONFIG) {
  @Module({ imports: [buildSupportModule(testDatabase, config), AgentModule] })
  class TestAppModule {}
  return NestFactory.createApplicationContext(TestAppModule, {
    logger: false,
    abortOnError: false,
  });
}

async function collect(agent: AgentApi): Promise<AgentTurnEvent[]> {
  const events: AgentTurnEvent[] = [];
  for await (const event of agent.respond(makeAgentTurnInput())) {
    events.push(event);
  }
  return events;
}

describe('AgentModule', () => {
  let app: INestApplicationContext | undefined;
  let testDatabase: TestDatabase | undefined;

  afterEach(async () => {
    await app?.close();
    await testDatabase?.close();
  });

  it('exporta AGENT_API, cria agent.runs e falha de forma tratada com o roteiro vazio', async () => {
    testDatabase = await createTestDatabase();
    app = await startApp(testDatabase);
    const agent = app.get<AgentApi>(AGENT_API, { strict: false });
    const events = await collect(agent);
    expect(events).toEqual([{ type: 'failed', code: 'agent_unavailable', retryable: true }]);
    const rows = await testDatabase.database.select().from(agentRunsTable);
    expect(rows).toEqual([]);
  });

  it('recusa subir com o provedor openrouter sem a chave da API', async () => {
    testDatabase = await createTestDatabase();
    const config = { ...BASE_CONFIG, LLM_PROVIDER: 'openrouter', OPENROUTER_API_KEY: undefined };
    await expect(startApp(testDatabase, config)).rejects.toThrow('OPENROUTER_API_KEY');
  });
});
