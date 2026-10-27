import type { PriorityAssessment, PriorityFacts, TicketDetail, TicketDraft } from '@nexo/contracts';
import { FakeTicketsApi } from '../../core/testing/fake-tickets-api.js';
import { NOW_ISO } from '../../core/testing/factories.js';

const FIRST_TICKET_SEQUENCE = 20520;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type CreateTicketInput = {
  requesterId: string;
  idempotencyKey: string;
  draft: TicketDraft;
};

export class EchoTicketsApi extends FakeTicketsApi {
  readonly created = new Map<string, TicketDetail>();
  private nextSequence = FIRST_TICKET_SEQUENCE;

  override async assessPriority(facts: PriorityFacts): Promise<PriorityAssessment> {
    const assessment = await super.assessPriority(facts);
    const dueAt = new Date(Date.parse(NOW_ISO) + ONE_DAY_MS).toISOString();
    return { ...assessment, dueAt };
  }

  override async create(input: CreateTicketInput): Promise<TicketDetail> {
    const existing = this.created.get(input.idempotencyKey);
    if (existing !== undefined) {
      return existing;
    }
    const base = await super.create(input);
    const ticket = this.fromDraft(base, input.draft);
    this.created.set(input.idempotencyKey, ticket);
    return ticket;
  }

  private fromDraft(base: TicketDetail, draft: TicketDraft): TicketDetail {
    const number = `INC-${this.nextSequence}`;
    this.nextSequence += 1;
    return {
      ...base,
      number,
      type: draft.type,
      title: draft.title,
      description: draft.description,
      category: draft.category,
      priority: draft.priority,
      affected: draft.affected,
      openedAt: NOW_ISO,
      dueAt: draft.dueAt,
    };
  }
}
