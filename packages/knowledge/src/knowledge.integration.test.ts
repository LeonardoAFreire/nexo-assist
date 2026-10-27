import { Global, Module, type INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { KNOWLEDGE_API, type KnowledgeApi } from '@nexo/contracts';
import { AppConfig } from '@nexo/shared/config';
import { DATABASE } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { KnowledgeModule } from './knowledge.module.js';

const SEARCH_LIMIT = 3;

type Harness = {
  app: INestApplicationContext;
  knowledge: KnowledgeApi;
  testDatabase: TestDatabase;
};

function buildSupportModule(testDatabase: TestDatabase, seed: boolean) {
  const config = { get: () => seed };
  @Global()
  @Module({
    providers: [
      { provide: DATABASE, useValue: testDatabase.database },
      { provide: AppConfig, useValue: config },
    ],
    exports: [DATABASE, AppConfig],
  })
  class SupportModule {}
  return SupportModule;
}

async function startHarness(seed: boolean): Promise<Harness> {
  const testDatabase = await createTestDatabase();
  @Module({ imports: [buildSupportModule(testDatabase, seed), KnowledgeModule] })
  class TestAppModule {}
  const app = await NestFactory.createApplicationContext(TestAppModule, { logger: false });
  const knowledge = app.get<KnowledgeApi>(KNOWLEDGE_API, { strict: false });
  return { app, knowledge, testDatabase };
}

describe('KnowledgeModule com a seed', () => {
  let harness: Harness;

  beforeEach(async () => {
    harness = await startHarness(true);
  });

  afterEach(async () => {
    await harness.app.close();
    await harness.testDatabase.close();
  });

  it('TI-18: encontra o artigo de horário pela busca em português', async () => {
    const result = await harness.knowledge.search({
      query: 'qual o horário do service desk?',
      limit: SEARCH_LIMIT,
    });
    expect(result[0]?.id).toBe('horario-service-desk');
  });

  it('encontra o artigo de VPN com as condições de aplicação', async () => {
    const result = await harness.knowledge.search({ query: 'VPN erro 809', limit: SEARCH_LIMIT });
    expect(result[0]?.id).toBe('vpn-erro-809');
    expect(result[0]?.conditions).toContain('Windows 10');
  });

  it('encontra o artigo com a consulta sem acentos', async () => {
    const result = await harness.knowledge.search({ query: 'trocar senha', limit: SEARCH_LIMIT });
    expect(result[0]?.id).toBe('troca-senha-rede');
  });

  it('respeita o limite pedido', async () => {
    const result = await harness.knowledge.search({ query: 'erro rede senha', limit: 1 });
    expect(result).toHaveLength(1);
  });

  it('devolve vazio para uma consulta sem relação com a central', async () => {
    expect(await harness.knowledge.search({ query: 'pizza', limit: SEARCH_LIMIT })).toEqual([]);
  });

  it('busca o artigo pelo id e devolve nulo quando não existe', async () => {
    expect((await harness.knowledge.get({ articleId: 'vpn-erro-809' }))?.title).toBe(
      'VPN com erro 809',
    );
    expect(await harness.knowledge.get({ articleId: 'inexistente' })).toBeNull();
  });

  it('mantém 8 artigos e trechos de até 600 caracteres', async () => {
    const result = await harness.knowledge.search({
      query: 'erro senha rede impressora software email pasta horario wifi visitantes',
      limit: 10,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((article) => article.excerpt.length <= 600)).toBe(true);
  });
});

describe('KnowledgeModule sem a seed', () => {
  it('não popula a central quando SEED_DEMO_DATA é falso', async () => {
    const harness = await startHarness(false);
    expect(await harness.knowledge.get({ articleId: 'vpn-erro-809' })).toBeNull();
    await harness.app.close();
    await harness.testDatabase.close();
  });
});
