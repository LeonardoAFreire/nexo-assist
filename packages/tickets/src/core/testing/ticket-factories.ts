import type { TicketDraft } from '@nexo/contracts';
import type { TicketRecord } from '../ticket-record.js';

export const ANA = 'ana';
export const BRUNO = 'bruno';
export const TEST_NOW = '2026-10-26T12:00:00.000Z';
const MILLISECONDS_PER_DAY = 86_400_000;

export function makeTicketRecord(overrides: Partial<TicketRecord> = {}): TicketRecord {
  return {
    number: 'INC-20400',
    type: 'incident',
    title: 'VPN não conecta',
    description: 'Erro 809 ao conectar na VPN de casa',
    category: 'network_vpn',
    priority: 'medium',
    status: 'open',
    openedAt: '2026-10-25T12:00:00.000Z',
    lastUpdatedAt: '2026-10-25T12:00:00.000Z',
    resolvedAt: null,
    dueAt: null,
    overdue: false,
    latestEvent: null,
    affected: 'only_me',
    requesterId: ANA,
    ...overrides,
  };
}

export function makeResolvedRecord(
  daysAgo: number,
  overrides: Partial<TicketRecord> = {},
): TicketRecord {
  const resolvedAt = new Date(Date.parse(TEST_NOW) - daysAgo * MILLISECONDS_PER_DAY).toISOString();
  return makeTicketRecord({
    status: 'resolved',
    resolvedAt,
    lastUpdatedAt: resolvedAt,
    ...overrides,
  });
}

export function makeDraft(overrides: Partial<TicketDraft> = {}): TicketDraft {
  return {
    title: 'Teclado sem resposta',
    description: 'O teclado do notebook parou de responder',
    type: 'incident',
    category: 'hardware',
    affected: 'only_me',
    priorityFacts: {
      impact: 'only_me',
      blocksWork: false,
      sameDayCommitment: false,
      hasWorkaround: true,
      kind: 'incident',
    },
    priority: 'low',
    dueAt: TEST_NOW,
    rule: 'regra',
    ...overrides,
  };
}
