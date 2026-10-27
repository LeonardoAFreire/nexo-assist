import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { type INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DEMO_PEOPLE } from '@nexo/contracts';
import { SessionTokenService } from '@nexo/shared/auth';
import { createTestDatabase } from '@nexo/shared/database/testing';
import cookieParser from 'cookie-parser';
import { ChatModule } from '../../chat.module.js';
import { ScriptedAgentApi } from '../../core/testing/fake-agent-api.js';
import { RecordingEventPublisher } from '../../core/testing/recording-event-publisher.js';
import { type ChatTestDoubles, type ChatTestSetup, chatTestImports } from './chat-test-support.js';
import { EchoTicketsApi } from './echo-tickets-api.js';

export { TEST_WEB_ORIGIN } from './chat-test-support.js';

export type ChatTestApp = Pick<ChatTestDoubles, 'agent' | 'tickets' | 'events'> & {
  baseUrl: string;
  sessionCookie(userId: string): Promise<string>;
  close(): Promise<void>;
};

export async function startChatTestApp(setup: ChatTestSetup = {}): Promise<ChatTestApp> {
  const doubles: ChatTestDoubles = {
    database: await createTestDatabase(),
    agent: new ScriptedAgentApi(),
    tickets: new EchoTicketsApi(),
    events: new RecordingEventPublisher(),
  };
  @Module({ imports: [...chatTestImports(doubles, setup), ChatModule] })
  class ChatTestAppModule {}
  const app = await NestFactory.create<NestExpressApplication>(ChatTestAppModule, {
    logger: false,
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  await app.listen(0);
  return toTestApp(app, doubles);
}

function toTestApp(app: INestApplication, doubles: ChatTestDoubles): ChatTestApp {
  const { port } = app.getHttpServer().address() as AddressInfo;
  const tokens = app.get(SessionTokenService);
  const roleOf = (userId: string) => DEMO_PEOPLE.find((person) => person.id === userId)?.role;
  return {
    ...doubles,
    baseUrl: `http://127.0.0.1:${port}/api`,
    sessionCookie: async (userId) => {
      const role = roleOf(userId) ?? 'employee';
      const { token } = await tokens.issue({ userId, role, remember: false });
      return `nexo_session=${token}`;
    },
    close: async () => {
      await app.close();
      await doubles.database.close();
    },
  };
}
