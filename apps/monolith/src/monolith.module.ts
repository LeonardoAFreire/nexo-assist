import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AgentModule } from '@nexo/agent';
import { ThrottlerModule } from '@nestjs/throttler';
import { ChatModule } from '@nexo/chat';
import { IdentityModule } from '@nexo/identity';
import { KnowledgeModule } from '@nexo/knowledge';
import { NexoAuthModule } from '@nexo/shared/auth';
import { AppConfig, NexoConfigModule } from '@nexo/shared/config';
import { DatabaseModule } from '@nexo/shared/database';
import { NexoEventsModule } from '@nexo/shared/events';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { NexoLoggerModule } from '@nexo/shared/logger';
import { TicketsModule } from '@nexo/tickets';
import { HealthController } from './health.controller.js';
import { WebStaticModule } from './web-static.module.js';

const ONE_MINUTE_MS = 60_000;

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
    ThrottlerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => [
        { ttl: ONE_MINUTE_MS, limit: config.get('CHAT_RATE_LIMIT_PER_MINUTE') },
      ],
    }),
    ChatModule,
    AgentModule,
    WebStaticModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: ApiExceptionFilter }],
})
export class MonolithModule {}
