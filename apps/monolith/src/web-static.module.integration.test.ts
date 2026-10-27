import 'reflect-metadata';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Global, type INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE, type Database } from '@nexo/shared/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HealthController } from './health.controller.js';
import { WebStaticModule } from './web-static.module.js';

const OK_STATUS = 200;
const NOT_FOUND_STATUS = 404;
const INDEX_HTML = '<!doctype html><html><body>Nexo Assist</body></html>';
const ASSET_JS = 'console.log("asset");';
const healthyDatabase = { execute: () => Promise.resolve([]) } as unknown as Database;

type StartedApp = { app: INestApplication; url: string };

async function startApp(webDir: string | undefined): Promise<StartedApp> {
  @Global()
  @Module({
    providers: [
      { provide: AppConfig, useValue: { get: () => webDir } },
      { provide: DATABASE, useValue: healthyDatabase },
    ],
    exports: [AppConfig, DATABASE],
  })
  class SupportModule {}
  @Module({ imports: [SupportModule, WebStaticModule], controllers: [HealthController] })
  class TestModule {}
  const app = await NestFactory.create(TestModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0);
  return { app, url: await app.getUrl() };
}

describe('WebStaticModule', () => {
  let webDir: string;
  let app: INestApplication | undefined;

  beforeEach(() => {
    webDir = mkdtempSync(join(tmpdir(), 'nexo-web-'));
    writeFileSync(join(webDir, 'index.html'), INDEX_HTML);
    writeFileSync(join(webDir, 'app.js'), ASSET_JS);
  });

  afterEach(async () => {
    await app?.close();
    app = undefined;
    rmSync(webDir, { recursive: true, force: true });
  });

  it('serve o index.html na raiz e nas rotas do front', async () => {
    const started = await startApp(webDir);
    app = started.app;
    const root = await fetch(`${started.url}/`);
    const chat = await fetch(`${started.url}/chat`);
    expect(root.status).toBe(OK_STATUS);
    expect(await root.text()).toBe(INDEX_HTML);
    expect(chat.status).toBe(OK_STATUS);
    expect(await chat.text()).toBe(INDEX_HTML);
  });

  it('serve os arquivos estáticos do build', async () => {
    const started = await startApp(webDir);
    app = started.app;
    const response = await fetch(`${started.url}/app.js`);
    expect(response.status).toBe(OK_STATUS);
    expect(await response.text()).toBe(ASSET_JS);
  });

  it('mantém o health check e a API fora do fallback do front', async () => {
    const started = await startApp(webDir);
    app = started.app;
    const health = await fetch(`${started.url}/api/health`);
    const unknown = await fetch(`${started.url}/api/inexistente`);
    expect(await health.json()).toEqual({ status: 'ok' });
    expect(unknown.status).toBe(NOT_FOUND_STATUS);
    expect(unknown.headers.get('content-type')).toContain('application/json');
  });

  it.each([undefined, ''])(
    'não serve o front quando SERVE_WEB_DIR está ausente ou vazio (%j)',
    async (missingDir) => {
      const started = await startApp(missingDir);
      app = started.app;
      const root = await fetch(`${started.url}/`);
      const health = await fetch(`${started.url}/api/health`);
      expect(root.status).toBe(NOT_FOUND_STATUS);
      expect(health.status).toBe(OK_STATUS);
    },
  );
});
