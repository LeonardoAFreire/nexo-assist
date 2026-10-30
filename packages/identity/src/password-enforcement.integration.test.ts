import 'reflect-metadata';
import type { AddressInfo } from 'node:net';
import { Global, Module, type INestApplication } from '@nestjs/common';
import { APP_FILTER, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DEMO_PEOPLE } from '@nexo/contracts';
import { NexoAuthModule } from '@nexo/shared/auth';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { ApiExceptionFilter } from '@nexo/shared/http';
import { PinoLogger } from '@nexo/shared/logger';
import cookieParser from 'cookie-parser';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdentityModule } from './identity.module.js';
import { usersTable } from './persistence/users.table.js';

const WEB_ORIGIN = 'http://localhost:5173';
const DEFAULT_PASSWORD = 'senha-de-teste';
const ANA = DEMO_PEOPLE[0]!;
const CONFIG_VALUES: Record<string, unknown> = {
  JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
  SESSION_TTL_HOURS: 8,
  SESSION_REMEMBER_DAYS: 7,
  WEB_ORIGIN,
  NODE_ENV: 'production',
  SEED_USER_PASSWORD: DEFAULT_PASSWORD,
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

function login(password: string): Promise<Response> {
  return fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
    body: JSON.stringify({ email: ANA.email, password }),
  });
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

describe('senha padrão em produção', () => {
  it('autentica com a senha padrão do seed', async () => {
    const response = await login(DEFAULT_PASSWORD);
    expect(response.status).toBe(200);
    expect(response.headers.getSetCookie()[0]).toMatch(/^nexo_session=/);
  });

  it('recusa qualquer outra senha, sem cookie e com mensagem genérica', async () => {
    const response = await login('qualquer');
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await response.json()).toEqual({
      error: { code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' },
    });
  });

  it('guarda só o hash da senha, nunca o texto', async () => {
    const rows = await testDatabase.database.select().from(usersTable);
    expect(rows).toHaveLength(DEMO_PEOPLE.length);
    for (const row of rows) {
      expect(row.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(row.passwordHash).not.toContain(DEFAULT_PASSWORD);
    }
  });
});
