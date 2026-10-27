import type { PendingAction, TicketDetail, TicketDraft } from '@nexo/contracts';

const DRAFT_TIME = '2026-10-27T12:43:00.000Z';

export function makeDraft(overrides: Partial<TicketDraft> = {}): TicketDraft {
  return {
    title: 'VPN não conecta no notebook',
    description: 'Desde 20/10 o notebook não conecta na VPN e mostra o erro 809.',
    type: 'incident',
    category: 'network_vpn',
    affected: 'only_me',
    priorityFacts: {
      impact: 'only_me',
      blocksWork: true,
      sameDayCommitment: true,
      hasWorkaround: false,
      kind: 'incident',
    },
    priority: 'high',
    dueAt: '2026-10-27T16:43:00.000Z',
    rule: 'prioridade alta: impede uma pessoa de trabalhar e há compromisso hoje',
    ...overrides,
  };
}

export function makePendingAction(overrides: Partial<PendingAction> = {}): PendingAction {
  return {
    id: '5d0c0000-0000-4000-8000-000000000001',
    displayNumber: 'D-381',
    kind: 'create_ticket',
    status: 'pending',
    draft: makeDraft(),
    targetNumber: null,
    complement: null,
    resultTicket: null,
    confirmedVia: null,
    createdAt: DRAFT_TIME,
    resolvedAt: null,
    ...overrides,
  };
}

export function makeTicketDetail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    number: 'INC-20519',
    type: 'incident',
    title: 'VPN não conecta no notebook',
    category: 'network_vpn',
    priority: 'high',
    status: 'open',
    openedAt: DRAFT_TIME,
    lastUpdatedAt: DRAFT_TIME,
    resolvedAt: null,
    dueAt: '2026-10-27T16:43:00.000Z',
    overdue: false,
    latestEvent: null,
    description: 'Desde 20/10 o notebook não conecta na VPN.',
    affected: 'only_me',
    ...overrides,
  };
}
