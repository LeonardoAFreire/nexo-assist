import 'reflect-metadata';
import { type INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DATABASE, type Database } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';

const OK_STATUS = 200;
const UNAVAILABLE_STATUS = 503;

async function startApp(database: Database): Promise<{ app: INestApplication; url: string }> {
  @Module({
    controllers: [HealthController],
    providers: [{ provide: DATABASE, useValue: database }],
  })
  class HealthTestModule {}
  const app = await NestFactory.create(HealthTestModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0);
  return { app, url: await app.getUrl() };
}

describe('GET /api/health', () => {
  let app: INestApplication | undefined;
  let testDatabase: TestDatabase | undefined;

  afterEach(async () => {
    await app?.close();
    await testDatabase?.close();
    app = undefined;
    testDatabase = undefined;
  });

  it('responde 200 com o banco disponível', async () => {
    testDatabase = await createTestDatabase();
    const started = await startApp(testDatabase.database);
    app = started.app;
    const response = await fetch(`${started.url}/api/health`);
    expect(response.status).toBe(OK_STATUS);
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('responde 503 quando o ping no banco falha', async () => {
    const failingDatabase = {
      execute: () => Promise.reject(new Error('conexão recusada')),
    } as unknown as Database;
    const started = await startApp(failingDatabase);
    app = started.app;
    const response = await fetch(`${started.url}/api/health`);
    expect(response.status).toBe(UNAVAILABLE_STATUS);
  });
});
