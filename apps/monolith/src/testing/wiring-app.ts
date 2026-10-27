import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { Global, Module, type INestApplication, type Type } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerModule } from '@nestjs/throttler';
import { AgentModule } from '@nexo/agent';
import { ChatModule } from '@nexo/chat';
import { IdentityModule } from '@nexo/identity';
import { KnowledgeModule } from '@nexo/knowledge';
import { NexoAuthModule } from '@nexo/shared/auth';
import { AppConfig, envSchema } from '@nexo/shared/config';
import { DATABASE, type Database } from '@nexo/shared/database';
import { NexoEventsModule } from '@nexo/shared/events';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { PinoLogger } from '@nexo/shared/logger';
import { TicketsModule } from '@nexo/tickets';
import cookieParser from 'cookie-parser';

export const WIRING_WEB_ORIGIN = 'http://localhost:5173';
const ONE_MINUTE_MS = 60_000;

const config = envSchema.parse({
  WEB_ORIGIN: WIRING_WEB_ORIGIN,
  JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
  DATABASE_URL: 'postgres://nexo:nexo@localhost:5432/nexo',
  LLM_PROVIDER: 'scripted',
  NODE_ENV: 'test',
  SEED_DEMO_DATA: 'true',
});

const silentLogger = {
  setContext: () => undefined,
  error: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  debug: () => undefined,
};

export type WiringApp = {
  app: INestApplication;
  baseUrl: string;
};

function supportModule(database: Database): Type {
  @Global()
  @Module({
    providers: [
      { provide: AppConfig, useValue: { get: (key: keyof typeof config) => config[key] } },
      { provide: PinoLogger, useValue: silentLogger },
      { provide: DATABASE, useValue: database },
      { provide: APP_FILTER, useClass: ApiExceptionFilter },
    ],
    exports: [AppConfig, PinoLogger, DATABASE],
  })
  class SupportModule {}
  return SupportModule;
}

function wiringModule(database: Database): Type {
  const limit = config.CHAT_RATE_LIMIT_PER_MINUTE;
  @Module({
    imports: [
      supportModule(database),
      NexoEventsModule,
      NexoAuthModule,
      ThrottlerModule.forRoot([{ ttl: ONE_MINUTE_MS, limit }]),
      IdentityModule,
      KnowledgeModule,
      TicketsModule,
      ChatModule,
      AgentModule,
    ],
  })
  class WiringTestModule {}
  return WiringTestModule;
}

export async function startWiringApp(database: Database): Promise<WiringApp> {
  const nest = await NestFactory.create<NestExpressApplication>(wiringModule(database), {
    logger: false,
  });
  nest.use(cookieParser());
  nest.setGlobalPrefix('api');
  await nest.listen(0);
  const { port } = nest.getHttpServer().address() as AddressInfo;
  return { app: nest, baseUrl: `http://127.0.0.1:${port}/api` };
}
