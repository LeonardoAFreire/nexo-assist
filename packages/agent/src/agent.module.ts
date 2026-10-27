import { Global, Module } from '@nestjs/common';
import {
  AGENT_API,
  KNOWLEDGE_API,
  TICKETS_API,
  type AgentApi,
  type KnowledgeApi,
  type TicketsApi,
} from '@nexo/contracts';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE, type Database } from '@nexo/shared/database';
import { AgentMigrator } from './persistence/agent.migrator.js';
import { buildAgentService } from './persistence/build-agent-service.js';
import { PinoAgentLogger } from './persistence/pino-agent-logger.js';

type AgentApiDependencies = [AppConfig, Database, TicketsApi, KnowledgeApi, PinoAgentLogger];

function createAgentApi(dependencies: AgentApiDependencies): AgentApi {
  const [config, database, tickets, knowledge, logger] = dependencies;
  return buildAgentService({ config, database, tickets, knowledge, logger });
}

@Global()
@Module({
  providers: [
    AgentMigrator,
    PinoAgentLogger,
    {
      provide: AGENT_API,
      inject: [AppConfig, DATABASE, TICKETS_API, KNOWLEDGE_API, PinoAgentLogger],
      useFactory: (...dependencies: AgentApiDependencies) => createAgentApi(dependencies),
    },
  ],
  exports: [AGENT_API],
})
export class AgentModule {}
