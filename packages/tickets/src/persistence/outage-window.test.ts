import { TicketsUnavailableError } from '@nexo/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '../core/testing/fake-clock.js';
import { OutageWindow, type OutageConfig } from './outage-window.js';

const OUTAGE_DURATION_MS = 4000;
const NEVER_OPENS = 0.99;
const ALWAYS_OPENS = 0;

function makeWindow(config: Partial<OutageConfig>, random: () => number, clock: FakeClock) {
  const complete: OutageConfig = {
    mode: 'random',
    probability: 0.1,
    durationMs: OUTAGE_DURATION_MS,
    ...config,
  };
  return new OutageWindow(complete, { clock, random });
}

describe('OutageWindow (TU-28)', () => {
  let clock: FakeClock;

  beforeEach(() => {
    clock = new FakeClock('2026-10-26T12:00:00.000Z');
  });

  it('não simula indisponibilidade no modo off', () => {
    const outage = makeWindow({ mode: 'off' }, () => ALWAYS_OPENS, clock);
    expect(() => outage.ensureAvailable()).not.toThrow();
  });

  it('mantém o legado indisponível no modo forced', () => {
    const outage = makeWindow({ mode: 'forced' }, () => NEVER_OPENS, clock);
    clock.advanceMilliseconds(OUTAGE_DURATION_MS * 10);
    expect(() => outage.ensureAvailable()).toThrow(TicketsUnavailableError);
  });

  it('abre uma janela pela duração configurada e responde depois dela', () => {
    const outage = makeWindow({}, sequenceOf([ALWAYS_OPENS, NEVER_OPENS]), clock);
    expect(() => outage.ensureAvailable()).toThrow(TicketsUnavailableError);
    clock.advanceMilliseconds(OUTAGE_DURATION_MS - 1);
    expect(() => outage.ensureAvailable()).toThrow(TicketsUnavailableError);
    clock.advanceMilliseconds(1);
    expect(() => outage.ensureAvailable()).not.toThrow();
  });

  it('não abre janela quando o sorteio fica acima da probabilidade', () => {
    const outage = makeWindow({ probability: 0.1 }, () => NEVER_OPENS, clock);
    expect(() => outage.ensureAvailable()).not.toThrow();
    expect(() => outage.ensureAvailable()).not.toThrow();
  });
});

function sequenceOf(values: number[]): () => number {
  const remaining = [...values];
  return () => remaining.shift() ?? NEVER_OPENS;
}
