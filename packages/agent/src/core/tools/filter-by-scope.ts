import type { TicketScope, TicketSummary } from '@nexo/contracts';
import { RESOLVED_STATUS } from './ticket-status-rules.js';

export function filterByScope<T extends TicketSummary>(tickets: T[], scope: TicketScope): T[] {
  if (scope === 'all') {
    return tickets;
  }
  const wantsClosed = scope === 'closed';
  return tickets.filter((ticket) => (ticket.status === RESOLVED_STATUS) === wantsClosed);
}
