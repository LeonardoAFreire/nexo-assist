import type { TicketDetail, TicketDraft } from '@nexo/contracts';
import type { Clock } from '../clock/clock.js';

export const EMPLOYEE_ID = '6f1c0a52-3c11-4a2f-9a55-0d6a6c1f0001';
export const CONVERSATION_ID = 'c71a2b3c-1d2e-4f50-8a61-7b8c9d0e1f20';
export const NOW_ISO = '2026-10-26T13:05:00.000Z';

export class FixedClock implements Clock {
  now(): Date {
    return new Date(NOW_ISO);
  }
}

export function makeDraft(overrides: Partial<TicketDraft> = {}): TicketDraft {
  return {
    title: 'VPN não conecta no notebook',
    description: 'Desde 20/10 o notebook não conecta na VPN e mostra o erro 809.',
    type: 'incident',
    category: 'network_vpn',
    affected: 'only_me',
    priorityFacts: {
      impact: 'only_me',
      blocksWork: false,
      sameDayCommitment: false,
      hasWorkaround: true,
      kind: 'incident',
    },
    priority: 'medium',
    dueAt: '2026-10-29T13:05:00.000Z',
    rule: 'prioridade média: há alternativa',
    ...overrides,
  };
}

export function makeTicket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    number: 'INC-20519',
    type: 'incident',
    title: 'VPN não conecta no notebook',
    category: 'network_vpn',
    priority: 'medium',
    status: 'open',
    openedAt: NOW_ISO,
    lastUpdatedAt: NOW_ISO,
    resolvedAt: null,
    dueAt: '2026-10-29T13:05:00.000Z',
    overdue: false,
    latestEvent: null,
    description: 'Desde 20/10 o notebook não conecta na VPN.',
    affected: 'only_me',
    ...overrides,
  };
}
