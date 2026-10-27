import { TicketRuleViolationError } from '@nexo/contracts';
import { requireOwnTicket } from './require-own-ticket.js';
import { toLatestEvent, type TicketEvent } from './ticket-event.js';
import type { TicketRecord } from './ticket-record.js';
import type { TicketWriteDeps } from './ticket-write-deps.js';

export type ComplementTicketInput = {
  requesterId: string;
  number: string;
  text: string;
  idempotencyKey: string;
};

const RESOLVED_MESSAGE =
  'Este chamado já foi resolvido e não aceita complemento. Reabra-o dentro da janela ou abra um novo chamado.';
const EMPTY_TEXT_MESSAGE = 'O complemento não pode ficar vazio.';

export class ComplementTicket {
  constructor(private readonly deps: TicketWriteDeps) {}

  async execute(input: ComplementTicketInput): Promise<TicketRecord> {
    const { repository } = this.deps;
    const existing = await repository.findByIdempotencyKey(input);
    if (existing !== null) {
      return existing;
    }
    const ticket = await requireOwnTicket(repository, input);
    const text = input.text.trim();
    this.assertCanComplement(ticket, text);
    const event = this.buildEvent(input, text);
    const updated: TicketRecord = {
      ...ticket,
      description: `${ticket.description}\n\n${text}`,
      lastUpdatedAt: event.occurredAt,
      latestEvent: toLatestEvent(event),
    };
    await repository.save({ ticket: updated, event });
    return updated;
  }

  private assertCanComplement(ticket: TicketRecord, text: string): void {
    if (ticket.status === 'resolved') {
      throw new TicketRuleViolationError(RESOLVED_MESSAGE);
    }
    if (text.length === 0) {
      throw new TicketRuleViolationError(EMPTY_TEXT_MESSAGE);
    }
  }

  private buildEvent(input: ComplementTicketInput, text: string): TicketEvent {
    return {
      kind: 'complemented',
      body: text,
      idempotencyKey: input.idempotencyKey,
      actor: input.requesterId,
      occurredAt: this.deps.clock.now().toISOString(),
    };
  }
}
