import type { TicketDraft } from '@nexo/contracts';
import { toLatestEvent, type TicketEvent } from './ticket-event.js';
import { TicketNumberGenerator } from './ticket-number-generator.js';
import type { TicketRecord } from './ticket-record.js';
import type { TicketWriteDeps } from './ticket-write-deps.js';

export type CreateTicketInput = {
  requesterId: string;
  draft: TicketDraft;
  idempotencyKey: string;
};

export class CreateTicket {
  private readonly numbers: TicketNumberGenerator;

  constructor(private readonly deps: TicketWriteDeps) {
    this.numbers = new TicketNumberGenerator(deps.repository);
  }

  async execute(input: CreateTicketInput): Promise<TicketRecord> {
    const existing = await this.deps.repository.findByIdempotencyKey(input);
    if (existing !== null) {
      return existing;
    }
    const event = this.buildEvent(input);
    const ticket = await this.buildTicket(input, event);
    await this.deps.repository.save({ ticket, event });
    return ticket;
  }

  private buildEvent(input: CreateTicketInput): TicketEvent {
    return {
      kind: 'created',
      body: input.draft.title,
      idempotencyKey: input.idempotencyKey,
      actor: input.requesterId,
      occurredAt: this.deps.clock.now().toISOString(),
    };
  }

  private async buildTicket(input: CreateTicketInput, event: TicketEvent): Promise<TicketRecord> {
    const { draft } = input;
    const assessment = this.deps.rules.assessor.assess(draft.priorityFacts);
    return {
      number: await this.numbers.next(draft.type),
      type: draft.type,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      affected: draft.affected,
      priority: assessment.priority,
      status: 'open',
      openedAt: event.occurredAt,
      lastUpdatedAt: event.occurredAt,
      resolvedAt: null,
      dueAt: assessment.dueAt,
      overdue: false,
      latestEvent: toLatestEvent(event),
      requesterId: input.requesterId,
    };
  }
}
