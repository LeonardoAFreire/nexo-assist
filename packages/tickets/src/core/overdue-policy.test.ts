import { beforeEach, describe, expect, it } from 'vitest';
import { DeadlinePolicy } from './deadline-policy.js';
import { OverduePolicy, type OverdueSubject } from './overdue-policy.js';
import { ServiceDeskCalendar } from './service-desk-calendar.js';
import { FakeClock } from './testing/fake-clock.js';

function makeSubject(overrides: Partial<OverdueSubject> = {}): OverdueSubject {
  return {
    priority: 'medium',
    status: 'awaiting_analyst',
    lastUpdatedAt: new Date('2026-10-20T10:20:00-03:00'),
    ...overrides,
  };
}

describe('OverduePolicy', () => {
  const policy = new OverduePolicy(new DeadlinePolicy(new ServiceDeskCalendar()));
  let clock: FakeClock;

  beforeEach(() => {
    clock = new FakeClock('2026-10-26T10:05:00-03:00');
  });

  it('TU-06: marca como vencido um chamado médio sem atualização há mais de 3 dias úteis', () => {
    expect(policy.isOverdue(makeSubject(), clock.now())).toBe(true);
  });

  it('não marca como vencido dentro do prazo', () => {
    clock.set('2026-10-22T10:00:00-03:00');
    expect(policy.isOverdue(makeSubject(), clock.now())).toBe(false);
  });

  it('não vence no instante exato do prazo e vence um milissegundo depois', () => {
    clock.set('2026-10-23T10:20:00-03:00');
    expect(policy.isOverdue(makeSubject(), clock.now())).toBe(false);
    clock.advanceMilliseconds(1);
    expect(policy.isOverdue(makeSubject(), clock.now())).toBe(true);
  });

  it('nunca vence um chamado resolvido', () => {
    const resolved = makeSubject({ status: 'resolved' });
    expect(policy.isOverdue(resolved, clock.now())).toBe(false);
    expect(policy.dueAt(resolved)).toBeNull();
  });

  it('reinicia o prazo na última atualização', () => {
    const updated = makeSubject({ lastUpdatedAt: new Date('2026-10-26T09:00:00-03:00') });
    clock.set('2026-10-26T10:05:00-03:00');
    expect(policy.isOverdue(updated, clock.now())).toBe(false);
  });

  it('calcula o prazo a partir da última atualização', () => {
    const dueAt = policy.dueAt(makeSubject());
    expect(dueAt?.toISOString()).toBe('2026-10-23T13:20:00.000Z');
  });
});
