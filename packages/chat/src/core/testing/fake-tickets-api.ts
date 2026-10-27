import type {
  PriorityAssessment,
  PriorityFacts,
  TicketDetail,
  TicketDraft,
  TicketPriority,
  TicketsApi,
} from '@nexo/contracts';
import { makeTicket } from './factories.js';

const ONE_HOUR_MS = 3_600_000;
const TWO_HOURS_MS = 2 * ONE_HOUR_MS;
const BROAD_IMPACTS: readonly PriorityFacts['impact'][] = ['my_team', 'whole_company'];

function priorityOf(facts: PriorityFacts): TicketPriority {
  if (!facts.blocksWork) {
    return 'medium';
  }
  return BROAD_IMPACTS.includes(facts.impact) ? 'critical' : 'high';
}

export type FakeTicketsApiMethods = Pick<
  TicketsApi,
  'assessPriority' | 'contactDeadline' | 'create' | 'complement' | 'reopen'
>;

export type WriteCall = {
  kind: 'create' | 'complement' | 'reopen';
  requesterId: string;
  idempotencyKey: string;
};

export class FakeTicketsApi implements FakeTicketsApiMethods {
  readonly writes: WriteCall[] = [];
  readonly failures: Error[] = [];

  async assessPriority(facts: PriorityFacts): Promise<PriorityAssessment> {
    const priority = priorityOf(facts);
    const unit = priority === 'critical' ? 'clock_hours' : 'business_hours';
    return {
      priority,
      deadline: { amount: priority === 'critical' ? 1 : 4, unit },
      dueAt: `due-${priority}`,
      rule: `regra-${priority}`,
    };
  }

  async contactDeadline(input: { from: string; critical: boolean }): Promise<string> {
    const delay = input.critical ? ONE_HOUR_MS : TWO_HOURS_MS;
    return new Date(Date.parse(input.from) + delay).toISOString();
  }

  async create(input: {
    requesterId: string;
    idempotencyKey: string;
    draft: TicketDraft;
  }): Promise<TicketDetail> {
    return this.write('create', input, makeTicket({ title: input.draft.title }));
  }

  async complement(input: {
    requesterId: string;
    idempotencyKey: string;
    number: string;
  }): Promise<TicketDetail> {
    return this.write('complement', input, makeTicket({ number: input.number }));
  }

  async reopen(input: {
    requesterId: string;
    idempotencyKey: string;
    number: string;
  }): Promise<TicketDetail> {
    return this.write('reopen', input, makeTicket({ number: input.number, status: 'open' }));
  }

  private write(
    kind: WriteCall['kind'],
    input: { requesterId: string; idempotencyKey: string },
    ticket: TicketDetail,
  ): Promise<TicketDetail> {
    const failure = this.failures.shift();
    if (failure !== undefined) {
      return Promise.reject(failure);
    }
    this.writes.push({ kind, ...input });
    return Promise.resolve(ticket);
  }
}
