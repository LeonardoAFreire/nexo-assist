import { TicketRuleViolationError } from '@nexo/contracts';
import { REOPEN_WINDOW_DAYS } from './reopen-policy.js';
import { requireOwnTicket } from './require-own-ticket.js';
import { toLatestEvent, type TicketEvent } from './ticket-event.js';
import type { TicketRecord } from './ticket-record.js';
import type { TicketWriteDeps } from './ticket-write-deps.js';

export type ReopenTicketInput = {
  requesterId: string;
  number: string;
  reason: string;
  idempotencyKey: string;
};

export class ReopenTicket {
  constructor(private readonly deps: TicketWriteDeps) {}

  async execute(input: ReopenTicketInput): Promise<TicketRecord> {
    const { repository } = this.deps;
    const existing = await repository.findByIdempotencyKey(input);
    if (existing !== null) {
      return existing;
    }
    const ticket = await requireOwnTicket(repository, input);
    const event = this.buildEvent(input);
    this.assertCanReopen(ticket, new Date(event.occurredAt));
    const reopened: TicketRecord = {
      ...ticket,
      status: 'open',
      resolvedAt: null,
      lastUpdatedAt: event.occurredAt,
      latestEvent: toLatestEvent(event),
    };
    await repository.save({ ticket: reopened, event });
    return reopened;
  }

  private assertCanReopen(ticket: TicketRecord, now: Date): void {
    if (ticket.status !== 'resolved' || ticket.resolvedAt === null) {
      throw new TicketRuleViolationError(`O chamado ${ticket.number} não está resolvido.`);
    }
    const resolvedAt = new Date(ticket.resolvedAt);
    if (!this.deps.rules.reopen.canReopen(resolvedAt, now)) {
      const days = this.deps.rules.reopen.daysSinceResolution(resolvedAt, now);
      throw new TicketRuleViolationError(
        `O chamado ${ticket.number} foi resolvido há ${days} dias, fora da janela de ${REOPEN_WINDOW_DAYS} dias para reabrir. Abra um novo chamado citando o anterior.`,
      );
    }
  }

  private buildEvent(input: ReopenTicketInput): TicketEvent {
    return {
      kind: 'reopened',
      body: input.reason,
      idempotencyKey: input.idempotencyKey,
      actor: input.requesterId,
      occurredAt: this.deps.clock.now().toISOString(),
    };
  }
}
