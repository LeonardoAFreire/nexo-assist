import { runMigrations } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { agentRunsTable } from '../../src/persistence/agent-runs.table.js';
import { AGENT_SCHEMA } from '../../src/persistence/agent-schema.js';
import { buildRunReport, type RunRow } from './build-run-report.js';
import { loadRunRows } from './load-run-rows.js';
import { renderRunReport } from './render-run-report.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;
const CONVERSATION_A = '0b9a8c7d-6e5f-4a3b-8c2d-1e0f9a8b7c6d';
const CONVERSATION_B = '1c0b9d8e-7f6a-4b4c-9d3e-2f1a0b9c8d7e';
const DAY_MS = 86_400_000;

function makeRow(overrides: Partial<RunRow> = {}): RunRow {
  return {
    conversationId: CONVERSATION_A,
    firstTokenMs: 800,
    costUsd: 0.002,
    durationMs: 2000,
    outcome: 'answered',
    models: ['openai/gpt-4o-mini'],
    ...overrides,
  };
}

describe('buildRunReport', () => {
  it('calcula p50 e p95 do primeiro trecho e o custo médio por conversa', () => {
    const rows = [
      makeRow({ firstTokenMs: 500, costUsd: 0.002 }),
      makeRow({ firstTokenMs: 900, costUsd: 0.004 }),
      makeRow({
        conversationId: CONVERSATION_B,
        firstTokenMs: 4000,
        costUsd: 0.01,
        outcome: 'handed_off',
      }),
      makeRow({ conversationId: CONVERSATION_B, firstTokenMs: null, costUsd: 0 }),
    ];
    const report = buildRunReport(rows);
    expect(report).toMatchObject({
      runs: 4,
      conversations: 2,
      firstTokenP50Ms: 900,
      firstTokenP95Ms: 4000,
    });
    expect(report.averageCostPerConversationUsd).toBeCloseTo(0.008);
    expect(report.averageCostPerRunUsd).toBeCloseTo(0.004);
    expect(report.outcomes).toEqual({ answered: 3, handed_off: 1 });
  });

  it('devolve valores vazios sem execuções', () => {
    expect(buildRunReport([])).toMatchObject({
      runs: 0,
      firstTokenP50Ms: null,
      averageCostPerConversationUsd: 0,
    });
  });

  it('agrupa o custo por combinação de modelos e renderiza sem texto de conversa', () => {
    const rows = [makeRow(), makeRow({ models: ['a/um', 'b/dois'], costUsd: 0.01 })];
    const text = renderRunReport(buildRunReport(rows));
    expect(text).toContain('a/um + b/dois: 1 execuções');
    expect(text).toContain('Custo médio por conversa');
    expect(text).toContain('Primeiro trecho p50');
  });
});

describe('loadRunRows', () => {
  let testDatabase: TestDatabase | undefined;

  afterEach(async () => {
    await testDatabase?.close();
  });

  it('lê agent.runs, com filtro opcional por dias', async () => {
    testDatabase = await createTestDatabase();
    await runMigrations(testDatabase.database, { folder: MIGRATIONS_FOLDER, schema: AGENT_SCHEMA });
    const base = {
      intent: null,
      confidence: null,
      handoffReason: null,
      steps: [],
      inputTokens: 1,
      outputTokens: 1,
      durationMs: 1,
    };
    const now = Date.now();
    await testDatabase.database.insert(agentRunsTable).values([
      {
        ...base,
        id: crypto.randomUUID(),
        conversationId: CONVERSATION_A,
        action: 'replied',
        models: ['m'],
        costUsd: 0.01,
        firstTokenMs: 700,
        outcome: 'answered',
        createdAt: new Date(now),
      },
      {
        ...base,
        id: crypto.randomUUID(),
        conversationId: CONVERSATION_B,
        action: 'replied',
        models: ['m'],
        costUsd: 0.02,
        firstTokenMs: 900,
        outcome: 'answered',
        createdAt: new Date(now - 10 * DAY_MS),
      },
    ]);
    const all = await loadRunRows(testDatabase.database, null);
    const recent = await loadRunRows(testDatabase.database, 2);
    expect(all).toHaveLength(2);
    expect(recent).toEqual([
      {
        conversationId: CONVERSATION_A,
        firstTokenMs: 700,
        costUsd: 0.01,
        durationMs: 1,
        outcome: 'answered',
        models: ['m'],
      },
    ]);
  });
});
