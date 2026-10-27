import type { TicketScope, TicketSummary } from '@nexo/contracts';

const CLOSED_STATUS = 'resolved';

export function filterByScope<T extends TicketSummary>(tickets: T[], scope: TicketScope): T[] {
  if (scope === 'all') {
    return tickets;
  }
  const wantsClosed = scope === 'closed';
  return tickets.filter((ticket) => (ticket.status === CLOSED_STATUS) === wantsClosed);
}
