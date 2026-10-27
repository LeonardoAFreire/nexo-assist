import { describe, expect, it } from 'vitest';
import { percentile } from './percentile.js';
import { renderEvalSummary } from './render-summary.js';
import { summarize } from './summarize.js';
import type { CriterionResult, EvalGoal, RunResult } from './types.js';

function criterion(id: string, passed: boolean): CriterionResult {
  return { id, description: id, passed };
}

function makeResult(overrides: Partial<RunResult> = {}): RunResult {
  return {
    scenarioId: 'cenario',
    goal: 'resolution' as EvalGoal,
    run: 1,
    passed: true,
    criteria: [criterion('transparency', true), criterion('no-unconfirmed-write', true)],
    metrics: {
      firstTokenMs: 1000,
      durationMs: 3000,
      costUsd: 0.001,
      inputTokens: 100,
      outputTokens: 20,
      models: ['modelo'],
    },
    stepKinds: [],
    failureCode: null,
    ...overrides,
  };
}

describe('percentile', () => {
  it('calcula p50 e p95 pelo método do posto mais próximo', () => {
    const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    expect(percentile(values, 0.5)).toBe(500);
    expect(percentile(values, 0.95)).toBe(1000);
    expect(percentile([], 0.5)).toBeNull();
  });
});

describe('summarize', () => {
  it('calcula a taxa de aprovação por cenário e os critérios que falharam', () => {
    const results = [
      makeResult({ run: 1 }),
      makeResult({ run: 2, passed: false, criteria: [criterion('used-searched_tickets', false)] }),
    ];
    const [scenario] = summarize(results).scenarios;
    expect(scenario).toMatchObject({
      runs: 2,
      passedRuns: 1,
      failedCriteria: ['used-searched_tickets'],
    });
  });

  it('mede confirmação, privacidade e transparência nos critérios universais de todas as execuções', () => {
    const leak = makeResult({
      goal: 'scope',
      passed: false,
      criteria: [
        criterion('no-foreign-ticket-data', false),
        criterion('no-unconfirmed-write', false),
      ],
    });
    const goals = Object.fromEntries(
      summarize([makeResult(), leak]).goals.map((goal) => [goal.goal, goal]),
    );
    expect(goals.confirmation).toMatchObject({ rate: 0.5, met: false });
    expect(goals.privacy).toMatchObject({ rate: 0.5, met: false });
    expect(goals.resolution).toMatchObject({ rate: 1, met: true });
    expect(goals.scope).toMatchObject({ rate: 0, met: false });
  });

  it('agrega latência e custo médio das execuções', () => {
    const results = [
      makeResult({ metrics: { ...makeResult().metrics, firstTokenMs: 500, costUsd: 0.002 } }),
      makeResult({ metrics: { ...makeResult().metrics, firstTokenMs: 3000, costUsd: 0.004 } }),
    ];
    const { performance } = summarize(results);
    expect(performance.firstTokenP50Ms).toBe(500);
    expect(performance.firstTokenP95Ms).toBe(3000);
    expect(performance.averageCostUsd).toBeCloseTo(0.003);
  });

  it('renderiza a tabela com cenários, metas e desempenho', () => {
    const text = renderEvalSummary('modelo x', summarize([makeResult()]));
    expect(text).toContain('== modelo x ==');
    expect(text).toContain('cenario');
    expect(text).toContain('Resolução sem fila');
    expect(text).toContain('Primeiro trecho p50: 1000 ms');
    expect(text).toContain('Estimativa para 10 mensagens');
  });
});
