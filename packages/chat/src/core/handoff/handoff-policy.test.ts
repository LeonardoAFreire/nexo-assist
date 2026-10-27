import type { HandoffReason } from '@nexo/contracts';
import { describe, expect, it } from 'vitest';
import { FakeTicketsApi } from '../testing/fake-tickets-api.js';
import { NOW_ISO } from '../testing/factories.js';
import { HandoffPolicy } from './handoff-policy.js';

const TWO_HOURS_LATER = '2026-10-26T15:05:00.000Z';
const ONE_HOUR_LATER = '2026-10-26T14:05:00.000Z';

describe('HandoffPolicy', () => {
  const policy = new HandoffPolicy(new FakeTicketsApi());

  it.each<HandoffReason>(['requested', 'low_confidence', 'failure'])(
    'transfere para N1 com contato em 2 horas quando o motivo é %s',
    async (reason) => {
      const result = await policy.assess({ reason, handedOffAt: NOW_ISO });
      expect(result).toEqual({ level: 'N1', contactDueAt: TWO_HOURS_LATER });
    },
  );

  it('transfere para N2 com contato em 2 horas quando o chamado está vencido', async () => {
    const result = await policy.assess({ reason: 'overdue', handedOffAt: NOW_ISO });
    expect(result).toEqual({ level: 'N2', contactDueAt: TWO_HOURS_LATER });
  });

  it('transfere para N2 com contato em 1 hora quando o caso é crítico', async () => {
    const result = await policy.assess({ reason: 'critical', handedOffAt: NOW_ISO });
    expect(result).toEqual({ level: 'N2', contactDueAt: ONE_HOUR_LATER });
  });
});
