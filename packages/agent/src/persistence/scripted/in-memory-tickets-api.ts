import type { DuplicateCheck, PriorityAssessment, TicketDetail, TicketsApi } from '@nexo/contracts';
import { filterByScope } from '../../core/tools/filter-by-scope.js';

export type OwnedTicket = {
  requesterId: string;
  ticket: TicketDetail;
};

function notSupported(): never {
  throw new Error('Operação não suportada pelo InMemoryTicketsApi.');
}

export class InMemoryTicketsApi implements TicketsApi {
  constructor(private readonly owned: OwnedTicket[]) {}

  async listOwn(input: Parameters<TicketsApi['listOwn']>[0]): Promise<TicketDetail[]> {
    return filterByScope(this.ticketsOf(input.requesterId), input.scope);
  }

  async findOwn(input: Parameters<TicketsApi['findOwn']>[0]): Promise<TicketDetail | null> {
    const tickets = this.ticketsOf(input.requesterId);
    return tickets.find((ticket) => ticket.number === input.number) ?? null;
  }

  async searchOwn(input: Parameters<TicketsApi['searchOwn']>[0]): Promise<TicketDetail[]> {
    const term = input.query.toLowerCase();
    return this.ticketsOf(input.requesterId).filter((ticket) =>
      `${ticket.title} ${ticket.description}`.toLowerCase().includes(term),
    );
  }

  findDuplicates(): Promise<DuplicateCheck> {
    return notSupported();
  }

  assessPriority(): Promise<PriorityAssessment> {
    return notSupported();
  }

  contactDeadline(): Promise<string> {
    return notSupported();
  }

  create(): Promise<TicketDetail> {
    return notSupported();
  }

  complement(): Promise<TicketDetail> {
    return notSupported();
  }

  reopen(): Promise<TicketDetail> {
    return notSupported();
  }

  private ticketsOf(requesterId: string): TicketDetail[] {
    return this.owned
      .filter((entry) => entry.requesterId === requesterId)
      .map((entry) => entry.ticket);
  }
}
