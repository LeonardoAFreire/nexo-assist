import type { DuplicateCheck, PriorityAssessment, TicketDetail, TicketsApi } from '@nexo/contracts';
import {
  InMemoryTicketsApi,
  type OwnedTicket,
} from '../../src/persistence/scripted/in-memory-tickets-api.js';
import { assessPriority } from './assess-priority.js';
import { findOpenDuplicates } from './duplicate-matcher.js';

const TERM_SEPARATOR = /\s+/;
const CONTACT_DELAY_MS = 2 * 60 * 60 * 1000;
const WRITE_FORBIDDEN_MESSAGE = 'Escrita em chamados não é permitida nos evals.';

export class EvalTicketsApi implements TicketsApi {
  private readonly base: InMemoryTicketsApi;
  private writes = 0;

  constructor(
    private readonly entries: OwnedTicket[],
    private readonly now: Date,
  ) {
    this.base = new InMemoryTicketsApi(entries);
  }

  get writeCalls(): number {
    return this.writes;
  }

  listOwn(input: Parameters<TicketsApi['listOwn']>[0]): Promise<TicketDetail[]> {
    return this.base.listOwn(input);
  }

  findOwn(input: Parameters<TicketsApi['findOwn']>[0]): Promise<TicketDetail | null> {
    return this.base.findOwn(input);
  }

  async searchOwn(input: Parameters<TicketsApi['searchOwn']>[0]): Promise<TicketDetail[]> {
    const terms = input.query.toLowerCase().split(TERM_SEPARATOR);
    return this.ownTickets(input.requesterId).filter((ticket) => {
      const text = `${ticket.title} ${ticket.description}`.toLowerCase();
      return terms.some((term) => text.includes(term));
    });
  }

  async findDuplicates(
    input: Parameters<TicketsApi['findDuplicates']>[0],
  ): Promise<DuplicateCheck> {
    const tickets = this.ownTickets(input.requesterId);
    return findOpenDuplicates({ tickets, category: input.category, text: input.text });
  }

  async assessPriority(
    facts: Parameters<TicketsApi['assessPriority']>[0],
  ): Promise<PriorityAssessment> {
    return assessPriority(facts, this.now);
  }

  async contactDeadline(): Promise<string> {
    return new Date(this.now.getTime() + CONTACT_DELAY_MS).toISOString();
  }

  async create(): Promise<TicketDetail> {
    return this.rejectWrite();
  }

  async complement(): Promise<TicketDetail> {
    return this.rejectWrite();
  }

  async reopen(): Promise<TicketDetail> {
    return this.rejectWrite();
  }

  private ownTickets(requesterId: string): TicketDetail[] {
    return this.entries
      .filter((entry) => entry.requesterId === requesterId)
      .map((entry) => entry.ticket);
  }

  private rejectWrite(): never {
    this.writes += 1;
    throw new Error(WRITE_FORBIDDEN_MESSAGE);
  }
}
