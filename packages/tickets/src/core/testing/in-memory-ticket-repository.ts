import type { TicketType } from '@nexo/contracts';
import type { TicketEvent } from '../ticket-event.js';
import { INITIAL_SEQUENCES } from '../ticket-number-generator.js';
import type { TicketRecord } from '../ticket-record.js';
import type {
  RequesterIdempotencyKey,
  RequesterSearch,
  RequesterTicketKey,
  TicketRepository,
  TicketSave,
} from '../ticket-repository.js';
import { matchesQuery } from './matches-query.js';

export class InMemoryTicketRepository implements TicketRepository {
  private readonly tickets = new Map<string, TicketRecord>();
  private readonly keyedTickets = new Map<string, string>();
  private readonly sequences = { ...INITIAL_SEQUENCES };
  readonly events: Array<TicketEvent & { number: string }> = [];

  seed(tickets: TicketRecord[]): void {
    tickets.forEach((ticket: TicketRecord) => this.tickets.set(ticket.number, ticket));
  }

  listByRequester(requesterId: string): Promise<TicketRecord[]> {
    const owned = [...this.tickets.values()].filter(
      (ticket: TicketRecord) => ticket.requesterId === requesterId,
    );
    return Promise.resolve(owned);
  }

  async search(input: RequesterSearch): Promise<TicketRecord[]> {
    const owned = await this.listByRequester(input.requesterId);
    return owned.filter((ticket: TicketRecord) => matchesQuery(ticket, input.query));
  }

  findByNumber(input: RequesterTicketKey): Promise<TicketRecord | null> {
    const ticket = this.tickets.get(input.number);
    return Promise.resolve(ticket?.requesterId === input.requesterId ? ticket : null);
  }

  findByIdempotencyKey(input: RequesterIdempotencyKey): Promise<TicketRecord | null> {
    const number = this.keyedTickets.get(input.idempotencyKey);
    const ticket = number === undefined ? undefined : this.tickets.get(number);
    return Promise.resolve(ticket?.requesterId === input.requesterId ? ticket : null);
  }

  save(input: TicketSave): Promise<void> {
    const { ticket, event } = input;
    this.tickets.set(ticket.number, ticket);
    this.events.push({ ...event, number: ticket.number });
    if (event.idempotencyKey !== null) {
      this.keyedTickets.set(event.idempotencyKey, ticket.number);
    }
    return Promise.resolve();
  }

  nextSequence(type: TicketType): Promise<number> {
    const current = this.sequences[type];
    this.sequences[type] = current + 1;
    return Promise.resolve(current);
  }
}
