import { describe, expect, it } from 'vitest';
import { createRehearsalProvider } from '../providers.js';
import { runScenarioOnce } from '../run-scenario.js';
import { evalScenarios, selectScenarios } from './index.js';

const REQUIRED_ACCEPTANCE = [
  'CA-04',
  'CA-05',
  'CA-06',
  'CA-07',
  'CA-08',
  'CA-09',
  'CA-10',
  'CA-11',
  'CA-15',
  'CA-16',
  'CA-17',
  'CA-18',
  'CA-19',
  'CA-22',
  'CA-26',
  'CA-27',
];

describe('cenários dos evals', () => {
  it('têm ids únicos e cobrem os critérios de aceitação da tarefa', () => {
    const ids = evalScenarios.map((scenario) => scenario.id);
    expect(new Set(ids).size).toBe(ids.length);
    const covered = evalScenarios.flatMap((scenario) => scenario.acceptance);
    expect(REQUIRED_ACCEPTANCE.filter((item) => !covered.includes(item))).toEqual([]);
  });

  it('usam apenas funcionários de exemplo e têm critérios próprios', () => {
    for (const scenario of evalScenarios) {
      expect(scenario.criteria.length, scenario.id).toBeGreaterThan(0);
      expect(scenario.userMessage.trim(), scenario.id).not.toBe('');
    }
  });

  it.each(evalScenarios.map((scenario) => [scenario.id, scenario] as const))(
    'o ensaio roteirizado de %s passa em todos os critérios',
    async (_id, scenario) => {
      const result = await runScenarioOnce(scenario, createRehearsalProvider(), 1);
      const failed = result.criteria.filter((item) => !item.passed).map((item) => item.id);
      expect(failed).toEqual([]);
      expect(result.passed).toBe(true);
    },
  );

  it('selectScenarios filtra por id e recusa id desconhecido', () => {
    expect(selectScenarios(['pedido-analista']).map((scenario) => scenario.id)).toEqual([
      'pedido-analista',
    ]);
    expect(selectScenarios([])).toHaveLength(evalScenarios.length);
    expect(() => selectScenarios(['nao-existe'])).toThrow('Cenário desconhecido');
  });
});
