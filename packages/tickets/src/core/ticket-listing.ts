import type { TicketScope } from '@nexo/contracts';
import type { TicketRecord } from './ticket-record.js';

const SCOPE_FILTERS: Record<TicketScope, (ticket: TicketRecord) => boolean> = {
  open: (ticket: TicketRecord) => ticket.status !== 'resolved',
  closed: (ticket: TicketRecord) => ticket.status === 'resolved',
  all: () => true,
};

export function filterByScope(tickets: TicketRecord[], scope: TicketScope): TicketRecord[] {
  return tickets.filter(SCOPE_FILTERS[scope]);
}

export function sortMostRecentFirst(tickets: TicketRecord[]): TicketRecord[] {
  return [...tickets].sort((first: TicketRecord, second: TicketRecord) =>
    second.lastUpdatedAt.localeCompare(first.lastUpdatedAt),
  );
}
