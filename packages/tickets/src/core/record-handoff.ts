import type { ConversationHandedOffPayload } from '@nexo/contracts';
import { SYSTEM_ACTOR, toLatestEvent, type TicketEvent } from './ticket-event.js';
import type { TicketRecord } from './ticket-record.js';
import type { TicketWriteDeps } from './ticket-write-deps.js';

export class RecordHandoff {
  constructor(private readonly deps: TicketWriteDeps) {}

  async execute(handoff: ConversationHandedOffPayload): Promise<void> {
    for (const number of handoff.ticketNumbers) {
      await this.recordOne(handoff, number);
    }
  }

  private async recordOne(handoff: ConversationHandedOffPayload, number: string): Promise<void> {
    const { repository } = this.deps;
    const { requesterId } = handoff;
    const idempotencyKey = `handoff:${handoff.conversationId}:${number}`;
    if ((await repository.findByIdempotencyKey({ requesterId, idempotencyKey })) !== null) {
      return;
    }
    const ticket = await repository.findByNumber({ requesterId, number });
    if (ticket === null || ticket.requesterId !== requesterId) {
      return;
    }
    const event = this.buildEvent(handoff, idempotencyKey);
    const updated: TicketRecord = { ...ticket, latestEvent: toLatestEvent(event) };
    await repository.save({ ticket: updated, event });
  }

  private buildEvent(handoff: ConversationHandedOffPayload, idempotencyKey: string): TicketEvent {
    return {
      kind: 'handed_off',
      body: `Conversa transferida para analista ${handoff.level} (${handoff.reason})`,
      idempotencyKey,
      actor: SYSTEM_ACTOR,
      occurredAt: this.deps.clock.now().toISOString(),
    };
  }
}
