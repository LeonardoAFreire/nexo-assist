import type { TicketSummary } from '@nexo/contracts';

export const RESOLVED_STATUS = 'resolved';

export function isOpenTicket(ticket: Pick<TicketSummary, 'status'>): boolean {
  return ticket.status !== RESOLVED_STATUS;
}
