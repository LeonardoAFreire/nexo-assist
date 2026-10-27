import type { ArticleExcerpt, TicketDetail } from '@nexo/contracts';

export function makeTicket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    number: 'INC-20311',
    type: 'incident',
    title: 'Notebook lento',
    category: 'hardware',
    priority: 'medium',
    status: 'in_progress',
    openedAt: '2026-10-19T12:00:00.000Z',
    lastUpdatedAt: '2026-10-20T12:00:00.000Z',
    resolvedAt: null,
    dueAt: '2026-10-22T12:00:00.000Z',
    overdue: false,
    latestEvent: null,
    description: 'O notebook trava ao abrir planilhas grandes.',
    affected: 'only_me',
    ...overrides,
  };
}

export function makeArticle(overrides: Partial<ArticleExcerpt> = {}): ArticleExcerpt {
  return {
    id: 'vpn-erro-809',
    title: 'VPN com erro 809',
    excerpt: 'Libere as portas UDP 500 e 4500 no roteador.',
    conditions: 'Vale só para Windows 10.',
    category: 'network_vpn',
    ...overrides,
  };
}
