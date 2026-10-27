import type { PriorityFacts } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { PriorityMatrix } from './priority-matrix.js';

function makeFacts(overrides: Partial<PriorityFacts> = {}): PriorityFacts {
  return {
    impact: 'only_me',
    blocksWork: false,
    sameDayCommitment: false,
    hasWorkaround: false,
    kind: 'incident',
    ...overrides,
  };
}

describe('PriorityMatrix', () => {
  const matrix = new PriorityMatrix();

  it('TU-01: classifica como alta quando só uma pessoa é afetada e há compromisso no mesmo dia', () => {
    const result = matrix.classify(makeFacts({ blocksWork: true, sameDayCommitment: true }));
    expect(result.priority).toBe('high');
    expect(result.rule).toContain('compromisso hoje');
  });

  it.each(['my_team', 'whole_company'] as const)(
    'TU-02: classifica como crítica quando algo está parado para %s',
    (impact: PriorityFacts['impact']) => {
      const result = matrix.classify(makeFacts({ impact, blocksWork: true }));
      expect(result.priority).toBe('critical');
    },
  );

  it('classifica como alta quando só impede de trabalhar', () => {
    const result = matrix.classify(makeFacts({ blocksWork: true }));
    expect(result).toEqual({
      priority: 'high',
      rule: 'prioridade alta: impede uma pessoa de trabalhar',
    });
  });

  it('classifica como alta quando só há compromisso hoje', () => {
    const result = matrix.classify(makeFacts({ sameDayCommitment: true }));
    expect(result.priority).toBe('high');
    expect(result.rule).toBe('prioridade alta: há compromisso hoje');
  });

  it('não classifica como crítica quando a equipe é afetada mas nada está parado', () => {
    const result = matrix.classify(makeFacts({ impact: 'my_team' }));
    expect(result.priority).toBe('medium');
  });

  it.each([
    { hasWorkaround: true, impact: 'only_me' },
    { hasWorkaround: false, impact: 'unknown' },
  ] as const)(
    'TU-03: classifica incidente como média com %o',
    (overrides: Partial<PriorityFacts>) => {
      const result = matrix.classify(makeFacts(overrides));
      expect(result.priority).toBe('medium');
    },
  );

  it('TU-03: classifica como baixa em pedido sem urgência', () => {
    const result = matrix.classify(makeFacts({ kind: 'request', hasWorkaround: true }));
    expect(result.priority).toBe('low');
  });

  it('aplica a regra crítica antes da alta', () => {
    const facts = makeFacts({ impact: 'whole_company', blocksWork: true, sameDayCommitment: true });
    expect(matrix.classify(facts).priority).toBe('critical');
  });
});
