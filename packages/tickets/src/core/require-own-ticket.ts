import { TicketNotFoundError } from '@nexo/contracts';
import type { TicketRecord } from './ticket-record.js';
import type { RequesterTicketKey, TicketRepository } from './ticket-repository.js';

export async function requireOwnTicket(
  repository: TicketRepository,
  key: RequesterTicketKey,
): Promise<TicketRecord> {
  const ticket = await repository.findByNumber(key);
  if (ticket === null || ticket.requesterId !== key.requesterId) {
    throw new TicketNotFoundError();
  }
  return ticket;
}
