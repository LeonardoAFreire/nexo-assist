import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { Global, Module, type INestApplication } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ThrottlerModule } from '@nestjs/throttler';
import { AgentModule } from '@nexo/agent';
import { ChatModule } from '@nexo/chat';
import {
  type ConsoleEmployeeTickets,
  type ConsoleList,
  type Conversation,
  DEMO_ANALYSTS,
  DEMO_EMPLOYEES,
  type EmployeeConversationView,
  type TicketDetail,
} from '@nexo/contracts';
import { IdentityModule } from '@nexo/identity';
import { KnowledgeModule } from '@nexo/knowledge';
import { NexoAuthModule } from '@nexo/shared/auth';
import { AppConfig, envSchema } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { NexoEventsModule } from '@nexo/shared/events';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { PinoLogger } from '@nexo/shared/logger';
import { TicketsModule } from '@nexo/tickets';
import cookieParser from 'cookie-parser';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const WEB_ORIGIN = 'http://localhost:5173';
const ONE_MINUTE_MS = 60_000;
const ANA = DEMO_EMPLOYEES[0]!;
const RAFAEL = DEMO_ANALYSTS[0]!;
const CITED_TICKET = 'INC-20311';

let testDatabase: TestDatabase;
let app: INestApplication;
let baseUrl: string;

const config = envSchema.parse({
  WEB_ORIGIN,
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

@Global()
@Module({
  providers: [
    { provide: AppConfig, useValue: { get: (key: keyof typeof config) => config[key] } },
    { provide: PinoLogger, useValue: silentLogger },
    { provide: DATABASE, useFactory: () => testDatabase.database },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
  exports: [AppConfig, PinoLogger, DATABASE],
})
class SupportModule {}

@Module({
  imports: [
    SupportModule,
    NexoEventsModule,
    NexoAuthModule,
    ThrottlerModule.forRoot([{ ttl: ONE_MINUTE_MS, limit: config.CHAT_RATE_LIMIT_PER_MINUTE }]),
    IdentityModule,
    KnowledgeModule,
    TicketsModule,
    ChatModule,
    AgentModule,
  ],
})
class WiringTestModule {}

async function loginCookie(email = ANA.email): Promise<string> {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email, password: 'qualquer' }),
  });
  return (response.headers.getSetCookie()[0] ?? '').split(';')[0] ?? '';
}

beforeAll(async () => {
  testDatabase = await createTestDatabase();
  const nest = await NestFactory.create<NestExpressApplication>(WiringTestModule, {
    logger: false,
  });
  nest.use(cookieParser());
  nest.setGlobalPrefix('api');
  await nest.listen(0);
  app = nest;
  baseUrl = `http://127.0.0.1:${(nest.getHttpServer().address() as AddressInfo).port}/api`;
});

afterAll(async () => {
  await app.close();
  await testDatabase.close();
});

describe('chat sobre os módulos reais', () => {
  it('resolve identity, tickets e agent reais: sessão por login, conversa e turno com o agent', async () => {
    const cookie = await loginCookie();
    const headers = { 'content-type': 'application/json', origin: WEB_ORIGIN, cookie };
    const current = await fetch(`${baseUrl}/conversations/current`, { headers });
    const view = (await current.json()) as EmployeeConversationView;
    expect(current.status).toBe(200);
    expect(view.conversation).toBeNull();
    const sent = await fetch(`${baseUrl}/conversations/current/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: 'Qual o status do meu chamado?' }),
    });
    const stream = await sent.text();
    expect(sent.headers.get('content-type')).toContain('text/event-stream');
    expect(stream).toContain('event: message.accepted');
    expect(stream).toMatch(/event: turn\.(completed|failed)/);
  });
});

function jsonHeaders(cookie: string): Record<string, string> {
  return { 'content-type': 'application/json', origin: WEB_ORIGIN, cookie };
}

async function postJson(path: string, cookie: string, body: unknown): Promise<Response> {
  const headers = jsonHeaders(cookie);
  return fetch(`${baseUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}

async function getJson<T>(path: string, cookie: string): Promise<{ status: number; body: T }> {
  const response = await fetch(`${baseUrl}${path}`, { headers: jsonHeaders(cookie) });
  return { status: response.status, body: (await response.json()) as T };
}

describe('transferência sobre os módulos reais', () => {
  it('TI-09: registra a transferência no histórico do chamado citado e a mostra ao analista', async () => {
    const ana = await loginCookie();
    const sent = await postJson('/conversations/current/messages', ana, {
      text: `Quero saber do ${CITED_TICKET}`,
    });
    await sent.text();
    const handoff = await postJson('/conversations/current/handoff', ana, { reason: 'requested' });
    const conversation = (await handoff.json()) as Conversation;
    expect(handoff.status).toBe(200);
    expect(conversation.state).toBe('waiting_analyst');
    expect(conversation.handoff?.ticketNumbers).toEqual([CITED_TICKET]);
    const ticket = await getJson<TicketDetail>(`/tickets/${CITED_TICKET}`, ana);
    expect(ticket.body.latestEvent?.kind).toBe('handed_off');
    const analyst = await loginCookie(RAFAEL.email);
    const list = await getJson<ConsoleList>('/console/conversations?filter=for_you', analyst);
    const item = list.body.items.find((candidate) => candidate.id === conversation.id);
    expect(item).toMatchObject({ consoleStatus: 'transferred', ticketNumbers: [CITED_TICKET] });
    const panel = await getJson<ConsoleEmployeeTickets>(
      `/console/conversations/${conversation.id}/tickets`,
      analyst,
    );
    expect(panel.status).toBe(200);
    expect(panel.body.fromConversation.map((summary) => summary.number)).toEqual([CITED_TICKET]);
    expect(panel.body.others.open.length + panel.body.others.closed.length).toBeGreaterThan(0);
  });
});
