import { describe, expect, it } from 'vitest';
import { DeadlinePolicy } from './deadline-policy.js';
import { PriorityAssessor } from './priority-assessor.js';
import { PriorityMatrix } from './priority-matrix.js';
import { ServiceDeskCalendar } from './service-desk-calendar.js';
import { FakeClock } from './testing/fake-clock.js';

describe('PriorityAssessor', () => {
  it('monta a avaliação com prazo a partir do relógio', () => {
    const clock = new FakeClock('2026-10-23T16:00:00-03:00');
    const assessor = new PriorityAssessor(
      new PriorityMatrix(),
      new DeadlinePolicy(new ServiceDeskCalendar()),
      clock,
    );
    const result = assessor.assess({
      impact: 'only_me',
      blocksWork: true,
      sameDayCommitment: true,
      hasWorkaround: false,
      kind: 'incident',
    });
    expect(result).toEqual({
      priority: 'high',
      deadline: { amount: 4, unit: 'business_hours' },
      dueAt: '2026-10-26T13:00:00.000Z',
      rule: 'prioridade alta: impede uma pessoa de trabalhar e há compromisso hoje',
    });
  });
});
