import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { Global, Module, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { APP_FILTER } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DEMO_PEOPLE, IDENTITY_API, type IdentityApi, type SessionUser } from '@nexo/contracts';
import { NexoAuthModule } from '@nexo/shared/auth';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { PinoLogger } from '@nexo/shared/logger';
import cookieParser from 'cookie-parser';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdentityModule } from './identity.module.js';

const WEB_ORIGIN = 'http://localhost:5173';
const ANA = DEMO_PEOPLE[0]!;
const RAFAEL = DEMO_PEOPLE.find((person) => person.role === 'analyst')!;
const CONFIG_VALUES: Record<string, unknown> = {
  JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
  SESSION_TTL_HOURS: 8,
  SESSION_REMEMBER_DAYS: 7,
  WEB_ORIGIN,
  NODE_ENV: 'test',
  SEED_USER_PASSWORD: 'senha@1234',
};

let testDatabase: TestDatabase;
let app: INestApplication;
let baseUrl: string;

@Global()
@Module({
  providers: [
    { provide: AppConfig, useValue: { get: (key: string) => CONFIG_VALUES[key] } },
    { provide: PinoLogger, useValue: { setContext: () => undefined, error: () => undefined } },
    { provide: DATABASE, useFactory: () => testDatabase.database },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
  exports: [AppConfig, PinoLogger, DATABASE],
})
class TestSupportModule {}

@Module({ imports: [TestSupportModule, NexoAuthModule, IdentityModule] })
class TestAppModule {}

function post(path: string, body?: unknown, cookie?: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: WEB_ORIGIN,
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function sessionCookieOf(response: Response): string {
  const header = response.headers.getSetCookie()[0] ?? '';
  return header.split(';')[0] ?? '';
}

beforeAll(async () => {
  testDatabase = await createTestDatabase();
  const nest = await NestFactory.create<NestExpressApplication>(TestAppModule, { logger: false });
  nest.use(cookieParser());
  nest.setGlobalPrefix('api');
  await nest.listen(0);
  app = nest;
  const { port } = nest.getHttpServer().address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}/api`;
});

afterAll(async () => {
  await app.close();
  await testDatabase.close();
});

describe('autenticação (TI-01)', () => {
  it('autentica funcionário com qualquer senha e devolve o usuário da sessão', async () => {
    const response = await post('/auth/login', { email: ANA.email, password: 'qualquer' });
    const body = (await response.json()) as SessionUser;
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ id: ANA.id, email: ANA.email, role: 'employee', initials: 'AS' });
    expect(body.session.expiresAt).toEqual(expect.any(String));
    expect(response.headers.getSetCookie()[0]).toMatch(/^nexo_session=.+HttpOnly/i);
  });

  it('autentica analista com o nível de suporte', async () => {
    const response = await post('/auth/login', {
      email: RAFAEL.email.toUpperCase(),
      password: 'x',
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ role: 'analyst', supportLevel: 'N2' });
  });

  it('recusa e-mail desconhecido com mensagem genérica e sem cookie', async () => {
    const response = await post('/auth/login', { email: 'ninguem@nexo.com.br', password: 'x' });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' },
    });
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it('recusa corpo inválido com validation_error', async () => {
    const response = await post('/auth/login', { email: 'nao-e-email', password: 'x' });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'validation_error' } });
  });

  it('recusa senha vazia com invalid_credentials', async () => {
    const response = await post('/auth/login', { email: ANA.email, password: '' });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'invalid_credentials' } });
  });

  it('recusa login vindo de outra origem', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://evil.example' },
      body: JSON.stringify({ email: ANA.email, password: 'x' }),
    });
    expect(response.status).toBe(403);
  });
});

describe('sessão', () => {
  it('devolve o usuário em me com o cookie do login', async () => {
    const login = await post('/auth/login', { email: ANA.email, password: 'x' });
    const response = await fetch(`${baseUrl}/auth/me`, {
      headers: { cookie: sessionCookieOf(login) },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: ANA.id, email: ANA.email });
  });

  it('responde 401 em me sem sessão', async () => {
    const response = await fetch(`${baseUrl}/auth/me`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: 'unauthenticated' } });
  });

  it('limpa o cookie no logout e responde 204 mesmo sem sessão', async () => {
    const response = await post('/auth/logout');
    expect(response.status).toBe(204);
    expect(response.headers.getSetCookie()[0]).toMatch(/^nexo_session=;/);
  });
});

describe('IdentityApi', () => {
  it('devolve perfis pelo token público', async () => {
    const identity = app.get<IdentityApi>(IDENTITY_API);
    const profiles = await identity.findProfiles({ userIds: [ANA.id, RAFAEL.id] });
    expect(profiles.map((profile) => profile.name).sort()).toEqual(['Ana Souza', 'Rafael Lima']);
  });
});
