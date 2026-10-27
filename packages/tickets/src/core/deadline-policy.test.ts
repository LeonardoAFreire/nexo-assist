import type { TicketPriority } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { DeadlinePolicy } from './deadline-policy.js';
import { ServiceDeskCalendar } from './service-desk-calendar.js';

function iso(instant: Date): string {
  return instant.toISOString();
}

describe('DeadlinePolicy', () => {
  const policy = new DeadlinePolicy(new ServiceDeskCalendar());

  it('TU-04: soma horas úteis atravessando o fim do expediente e o fim de semana', () => {
    const friday = new Date('2026-10-23T16:00:00-03:00');
    const result = policy.dueAt({ priority: 'high', from: friday });
    expect(iso(result)).toBe(iso(new Date('2026-10-26T10:00:00-03:00')));
  });

  it('TU-05: conta o prazo crítico em hora corrida fora do expediente', () => {
    const saturday = new Date('2026-10-24T22:00:00-03:00');
    const result = policy.dueAt({ priority: 'critical', from: saturday });
    expect(iso(result)).toBe(iso(new Date('2026-10-24T23:00:00-03:00')));
  });

  it.each([
    ['critical', { amount: 1, unit: 'clock_hours' }],
    ['high', { amount: 4, unit: 'business_hours' }],
    ['medium', { amount: 3, unit: 'business_days' }],
    ['low', { amount: 5, unit: 'business_days' }],
  ] as const)('define o prazo da prioridade %s', (priority: TicketPriority, expected: unknown) => {
    expect(policy.deadlineFor(priority)).toEqual(expected);
  });

  it('conta o prazo médio em 3 dias úteis a partir do mesmo horário', () => {
    const tuesday = new Date('2026-10-20T10:20:00-03:00');
    const result = policy.dueAt({ priority: 'medium', from: tuesday });
    expect(iso(result)).toBe(iso(new Date('2026-10-23T10:20:00-03:00')));
  });

  it('conta o prazo baixo em 5 dias úteis atravessando o fim de semana', () => {
    const thursday = new Date('2026-10-22T09:00:00-03:00');
    const result = policy.dueAt({ priority: 'low', from: thursday });
    expect(iso(result)).toBe(iso(new Date('2026-10-29T09:00:00-03:00')));
  });

  it('dá contato em 2 horas úteis para chamado não crítico', () => {
    const friday = new Date('2026-10-23T17:00:00-03:00');
    const result = policy.contactDueAt({ from: friday, critical: false });
    expect(iso(result)).toBe(iso(new Date('2026-10-26T09:00:00-03:00')));
  });

  it('dá contato em 1 hora corrida para chamado crítico', () => {
    const night = new Date('2026-10-24T22:00:00-03:00');
    const result = policy.contactDueAt({ from: night, critical: true });
    expect(iso(result)).toBe(iso(new Date('2026-10-24T23:00:00-03:00')));
  });
});
