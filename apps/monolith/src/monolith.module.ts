import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AgentModule } from '@nexo/agent';
import { ChatModule } from '@nexo/chat';
import { IdentityModule } from '@nexo/identity';
import { KnowledgeModule } from '@nexo/knowledge';
import { NexoAuthModule } from '@nexo/shared/auth';
import { NexoConfigModule } from '@nexo/shared/config';
import { DatabaseModule } from '@nexo/shared/database';
import { NexoEventsModule } from '@nexo/shared/events';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { NexoLoggerModule } from '@nexo/shared/logger';
import { TicketsModule } from '@nexo/tickets';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    NexoConfigModule,
    NexoLoggerModule,
    NexoEventsModule,
    NexoAuthModule,
    DatabaseModule,
    IdentityModule,
    KnowledgeModule,
    TicketsModule,
    ChatModule,
    AgentModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class MonolithModule {}
