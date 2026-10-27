import { Global, Module, type ModuleMetadata, type Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AGENT_API, DEMO_PEOPLE, IDENTITY_API, TICKETS_API } from '@nexo/contracts';
import { NexoAuthModule } from '@nexo/shared/auth';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import type { TestDatabase } from '@nexo/shared/database/testing';
import { EventPublisher } from '@nexo/shared/events';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { PinoLogger } from '@nexo/shared/logger';
import type { ScriptedAgentApi } from '../../core/testing/fake-agent-api.js';
import { FakeIdentityApi } from '../../core/testing/fake-identity-api.js';
import type { RecordingEventPublisher } from '../../core/testing/recording-event-publisher.js';
import type { EchoTicketsApi } from './echo-tickets-api.js';

export const TEST_WEB_ORIGIN = 'http://localhost:5173';
const ONE_MINUTE_MS = 60_000;
const DEFAULT_RATE_LIMIT = 100;

const CONFIG_VALUES: Record<string, unknown> = {
  JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
  SESSION_TTL_HOURS: 8,
  SESSION_REMEMBER_DAYS: 7,
  WEB_ORIGIN: TEST_WEB_ORIGIN,
  NODE_ENV: 'test',
};

const SUPPORT_TOKENS = [
  AppConfig,
  PinoLogger,
  DATABASE,
  IDENTITY_API,
  TICKETS_API,
  AGENT_API,
  EventPublisher,
];

export type ChatTestDoubles = {
  database: TestDatabase;
  agent: ScriptedAgentApi;
  tickets: EchoTicketsApi;
  events: RecordingEventPublisher;
};

export type ChatTestSetup = {
  rateLimitPerMinute?: number;
  seedDemoData?: boolean;
};

function supportProviders(doubles: ChatTestDoubles, setup: ChatTestSetup): Provider[] {
  const config: Record<string, unknown> = {
    ...CONFIG_VALUES,
    SEED_DEMO_DATA: setup.seedDemoData ?? false,
  };
  const logger = { setContext: () => undefined, error: () => undefined };
  return [
    { provide: AppConfig, useValue: { get: (key: string) => config[key] } },
    { provide: PinoLogger, useValue: logger },
    { provide: DATABASE, useValue: doubles.database.database },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: IDENTITY_API, useValue: new FakeIdentityApi(DEMO_PEOPLE) },
    { provide: TICKETS_API, useValue: doubles.tickets },
    { provide: AGENT_API, useValue: doubles.agent },
    { provide: EventPublisher, useValue: doubles.events },
  ];
}

function buildSupportModule(doubles: ChatTestDoubles, setup: ChatTestSetup) {
  @Global()
  @Module({ providers: supportProviders(doubles, setup), exports: SUPPORT_TOKENS })
  class ChatSupportModule {}
  return ChatSupportModule;
}

export function chatTestImports(
  doubles: ChatTestDoubles,
  setup: ChatTestSetup = {},
): NonNullable<ModuleMetadata['imports']> {
  const limit = setup.rateLimitPerMinute ?? DEFAULT_RATE_LIMIT;
  return [
    buildSupportModule(doubles, setup),
    NexoAuthModule,
    ThrottlerModule.forRoot([{ ttl: ONE_MINUTE_MS, limit }]),
  ];
}
