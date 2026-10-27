import { Inject, Injectable } from '@nestjs/common';
import type {
  ConversationHandedOffPayload,
  DuplicateCheck,
  PriorityAssessment,
  PriorityFacts,
  TicketCategory,
  TicketDetail,
  TicketScope,
  TicketsApi,
  TicketSummary,
} from '@nexo/contracts';
import { CLOCK, type Clock } from './clock.js';
import type { ComplementTicketInput } from './complement-ticket.js';
import type { CreateTicketInput } from './create-ticket.js';
import type { ReopenTicketInput } from './reopen-ticket.js';
import { filterByScope, sortMostRecentFirst } from './ticket-listing.js';
import { TicketPresenter } from './ticket-presenter.js';
import type { TicketRecord } from './ticket-record.js';
import { TICKET_REPOSITORY, type TicketRepository } from './ticket-repository.js';
import { createTicketRules, type TicketRules } from './ticket-rules.js';
import { TicketWrites } from './ticket-writes.js';

@Injectable()
export class TicketsService implements TicketsApi {
  private readonly rules: TicketRules;
  private readonly presenter: TicketPresenter;
  private readonly writes: TicketWrites;

  constructor(
    @Inject(TICKET_REPOSITORY) private readonly repository: TicketRepository,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {
    this.rules = createTicketRules(clock);
    this.presenter = new TicketPresenter(this.rules.overdue, clock);
    this.writes = new TicketWrites({ repository, clock, rules: this.rules });
  }

  async listOwn(input: { requesterId: string; scope: TicketScope }): Promise<TicketSummary[]> {
    const tickets = await this.repository.listByRequester(input.requesterId);
    return this.toSummaries(filterByScope(tickets, input.scope));
  }

  async findOwn(input: { requesterId: string; number: string }): Promise<TicketDetail | null> {
    const ticket = await this.repository.findByNumber(input);
    if (ticket === null || ticket.requesterId !== input.requesterId) {
      return null;
    }
    return this.presenter.detail(ticket);
  }

  async searchOwn(input: { requesterId: string; query: string }): Promise<TicketSummary[]> {
    return this.toSummaries(await this.repository.search(input));
  }

  async findDuplicates(input: {
    requesterId: string;
    category: TicketCategory;
    text: string;
  }): Promise<DuplicateCheck> {
    const tickets = await this.repository.listByRequester(input.requesterId);
    return this.rules.duplicates.find({ ...input, tickets, now: this.clock.now() });
  }

  assessPriority(facts: PriorityFacts): Promise<PriorityAssessment> {
    return Promise.resolve(this.rules.assessor.assess(facts));
  }

  contactDeadline(input: { from: string; critical: boolean }): Promise<string> {
    const from = new Date(input.from);
    const dueAt = this.rules.deadlines.contactDueAt({ from, critical: input.critical });
    return Promise.resolve(dueAt.toISOString());
  }

  async create(input: CreateTicketInput): Promise<TicketDetail> {
    return this.presenter.detail(await this.writes.create(input));
  }

  async complement(input: ComplementTicketInput): Promise<TicketDetail> {
    return this.presenter.detail(await this.writes.complement(input));
  }

  async reopen(input: ReopenTicketInput): Promise<TicketDetail> {
    return this.presenter.detail(await this.writes.reopen(input));
  }

  recordHandoff(handoff: ConversationHandedOffPayload): Promise<void> {
    return this.writes.recordHandoff(handoff);
  }

  private toSummaries(tickets: TicketRecord[]): TicketSummary[] {
    return sortMostRecentFirst(tickets).map((ticket: TicketRecord) =>
      this.presenter.summary(ticket),
    );
  }
}
