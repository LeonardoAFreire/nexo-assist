import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { runMigrations } from '@nexo/shared/database';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AgentRun } from '../core/agent-run.js';
import { agentRunsTable } from './agent-runs.table.js';
import { AGENT_SCHEMA } from './agent-schema.js';
import { DrizzleAgentRunRepository } from './drizzle-agent-run.repository.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;
const CONVERSATION_A = '0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d';
const CONVERSATION_B = '1c0b9d8e-7f6a-4b4c-9d3e-2f1a0b9c8d7e';
const NOW = new Date('2026-10-27T12:00:00.000Z');
const HOUR_MS = 3_600_000;

function makeRun(overrides: Partial<AgentRun> = {}): AgentRun {
  return {
    id: crypto.randomUUID(),
    conversationId: CONVERSATION_A,
    intent: 'consultar_chamado',
    confidence: 0.9,
    action: 'respond',
    handoffReason: null,
    steps: [],
    models: ['openai/gpt-4o-mini'],
    inputTokens: 1000,
    outputTokens: 200,
    costUsd: 0.25,
    firstTokenMs: 800,
    durationMs: 2400,
    outcome: 'answered',
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * HOUR_MS).toISOString();
}

describe('DrizzleAgentRunRepository', () => {
  let testDatabase: TestDatabase;
  let runs: DrizzleAgentRunRepository;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    await runMigrations(testDatabase.database, {
      folder: MIGRATIONS_FOLDER,
      schema: AGENT_SCHEMA,
    });
    runs = new DrizzleAgentRunRepository(testDatabase.database);
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('soma o custo da janela móvel e ignora execuções mais antigas', async () => {
    await runs.save(makeRun({ costUsd: 0.25, createdAt: hoursAgo(1) }));
    await runs.save(makeRun({ costUsd: 0.5, createdAt: hoursAgo(23) }));
    await runs.save(makeRun({ costUsd: 3, createdAt: hoursAgo(30) }));
    const total = await runs.costSince(new Date(NOW.getTime() - 24 * HOUR_MS));
    expect(total).toBeCloseTo(0.75);
  });

  it('devolve zero quando não há execuções na janela', async () => {
    await expect(runs.costSince(new Date(NOW.getTime() - HOUR_MS))).resolves.toBe(0);
  });

  it('soma os tokens de entrada só da conversa pedida', async () => {
    await runs.save(makeRun({ inputTokens: 1500 }));
    await runs.save(makeRun({ inputTokens: 700 }));
    await runs.save(makeRun({ conversationId: CONVERSATION_B, inputTokens: 9000 }));
    await expect(runs.inputTokensOf(CONVERSATION_A)).resolves.toBe(2200);
    await expect(runs.inputTokensOf(crypto.randomUUID())).resolves.toBe(0);
  });

  it('grava passos, modelos e motivo da transferência sem alterar o conteúdo', async () => {
    const step = {
      id: 's1',
      kind: 'searched_tickets' as const,
      label: 'consultou seus chamados',
      result: '1 chamado encontrado',
      status: 'ok' as const,
      attempts: 1,
      durationMs: 12,
    };
    const run = makeRun({
      models: ['router', 'response'],
      handoffReason: 'low_confidence',
      steps: [step],
    });
    await runs.save(run);
    const rows = await testDatabase.database.select().from(agentRunsTable);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: run.id,
      models: ['router', 'response'],
      handoffReason: 'low_confidence',
      steps: [step],
      createdAt: NOW,
    });
  });
});
