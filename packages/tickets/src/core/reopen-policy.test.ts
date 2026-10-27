import { beforeEach, describe, expect, it } from 'vitest';
import { ReopenPolicy } from './reopen-policy.js';
import { FakeClock } from './testing/fake-clock.js';

const MILLISECONDS_PER_MINUTE = 60_000;

describe('ReopenPolicy', () => {
  const policy = new ReopenPolicy();
  const resolvedAt = new Date('2026-10-19T12:00:00Z');
  let clock: FakeClock;

  beforeEach(() => {
    clock = new FakeClock('2026-10-23T12:00:00Z');
  });

  it('TU-07: permite reabrir 4 dias após a resolução', () => {
    expect(policy.canReopen(resolvedAt, clock.now())).toBe(true);
  });

  it('TU-07: permite reabrir com exatamente 7 dias', () => {
    clock.set('2026-10-26T12:00:00Z');
    expect(policy.canReopen(resolvedAt, clock.now())).toBe(true);
  });

  it('TU-07: recusa reabrir com 7 dias e 1 minuto', () => {
    clock.set('2026-10-26T12:00:00Z');
    clock.advanceMilliseconds(MILLISECONDS_PER_MINUTE);
    expect(policy.canReopen(resolvedAt, clock.now())).toBe(false);
  });

  it('conta os dias completos desde a resolução', () => {
    expect(policy.daysSinceResolution(resolvedAt, clock.now())).toBe(4);
  });
});
