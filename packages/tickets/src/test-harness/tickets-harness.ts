import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { Global, Module } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { TICKETS_API, type DemoPerson, type TicketsApi } from '@nexo/contracts';
import { NexoAuthModule, SESSION_COOKIE_NAME, SessionTokenService } from '@nexo/shared/auth';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { EventPublisher, NexoEventsModule } from '@nexo/shared/events';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { PinoLogger } from '@nexo/shared/logger';
import cookieParser from 'cookie-parser';
import { configValues, fakeLogger } from './harness-support.js';
import { TicketsModule } from '../tickets.module.js';

export type TicketsHarness = {
  baseUrl: string;
  tickets: TicketsApi;
  publisher: EventPublisher;
  loggedErrors: unknown[];
  get: (path: string, person?: DemoPerson) => Promise<Response>;
  close: () => Promise<void>;
};

export async function startTicketsHarness(outageMode: 'off' | 'forced'): Promise<TicketsHarness> {
  const testDatabase = await createTestDatabase();
  const loggedErrors: unknown[] = [];
  const app = await createApp({ testDatabase, loggedErrors, outageMode });
  const { port } = app.getHttpServer().address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  const tokens = app.get(SessionTokenService);
  return {
    baseUrl,
    loggedErrors,
    tickets: app.get<TicketsApi>(TICKETS_API, { strict: false }),
    publisher: app.get(EventPublisher, { strict: false }),
    get: async (path: string, person?: DemoPerson) => {
      const headers: Record<string, string> = {};
      if (person) {
        const { token } = await tokens.issue({
          userId: person.id,
          role: person.role,
          remember: false,
        });
        headers.cookie = `${SESSION_COOKIE_NAME}=${token}`;
      }
      return fetch(`${baseUrl}${path}`, { headers });
    },
    close: async () => {
      await app.close();
      await testDatabase.close();
    },
  };
}

type AppOptions = {
  testDatabase: TestDatabase;
  loggedErrors: unknown[];
  outageMode: 'off' | 'forced';
};

async function createApp(options: AppOptions): Promise<NestExpressApplication> {
  const values = configValues(options.outageMode);
  const logger = fakeLogger(options.loggedErrors);
  @Global()
  @Module({
    providers: [
      { provide: AppConfig, useValue: { get: (key: string) => values[key] } },
      { provide: PinoLogger, useValue: logger },
      { provide: DATABASE, useValue: options.testDatabase.database },
      { provide: APP_FILTER, useClass: ApiExceptionFilter },
    ],
    exports: [AppConfig, PinoLogger, DATABASE],
  })
  class SupportModule {}
  @Module({ imports: [SupportModule, NexoEventsModule, NexoAuthModule, TicketsModule] })
  class TestAppModule {}
  const app = await NestFactory.create<NestExpressApplication>(TestAppModule, { logger: false });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.listen(0);
  return app;
}
