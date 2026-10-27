import type { TicketDetail } from '@nexo/contracts';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TicketCard } from './ticket-card.js';

function makeTicket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    number: 'INC-20311',
    type: 'incident',
    title: 'Notebook lento após atualização do Windows',
    category: 'hardware',
    priority: 'medium',
    status: 'awaiting_analyst',
    openedAt: '2026-10-14T13:20:00.000Z',
    lastUpdatedAt: '2026-10-20T13:20:00.000Z',
    resolvedAt: null,
    dueAt: '2026-10-23T13:20:00.000Z',
    overdue: false,
    latestEvent: null,
    description: 'Lentidão geral desde a atualização de 15/10.',
    affected: 'only_me',
    ...overrides,
  };
}

describe('TicketCard', () => {
  it('mostra os dados do chamado em pt-BR', () => {
    render(<TicketCard ticket={makeTicket()} />);
    expect(screen.getByRole('heading', { name: /notebook lento/i })).toBeInTheDocument();
    expect(screen.getByText('INC-20311')).toBeInTheDocument();
    expect(screen.getByText('Aguardando analista')).toBeInTheDocument();
    expect(screen.getByText('Prioridade média')).toBeInTheDocument();
    expect(screen.getByText('Hardware')).toBeInTheDocument();
    expect(screen.getByText(/Lentidão geral/)).toBeInTheDocument();
    expect(screen.getByText(/14\/10\/2026,? 10:20/)).toBeInTheDocument();
    expect(screen.getByText(/20\/10\/2026,? 10:20/)).toBeInTheDocument();
  });

  it('mostra "prazo vencido" em texto quando o chamado está vencido', () => {
    render(<TicketCard ticket={makeTicket({ overdue: true })} />);
    expect(screen.getByText(/prazo vencido/)).toBeInTheDocument();
  });

  it('não mostra "prazo vencido" quando o chamado está no prazo', () => {
    render(<TicketCard ticket={makeTicket({ overdue: false })} />);
    expect(screen.queryByText(/prazo vencido/)).not.toBeInTheDocument();
  });
});
