import { randomUUID } from 'node:crypto';
import type { ConfirmationChannel } from '@nexo/contracts';
import type { ResiliencePolicy } from '@nexo/shared/resilience';
import type { Clock } from '../clock/clock.js';
import type { MessageRepository } from '../messages/message-repository.js';
import {
  buildConfirmationResult,
  type ConfirmPendingActionResult,
} from './build-confirmation-result.js';
import type { PendingActionRecord } from './pending-action-record.js';
import type { PendingActionRepository } from './pending-action-repository.js';
import { type PendingActionTarget, requirePendingAction } from './require-pending-action.js';
import { TICKETS_RESILIENCE_POLICY } from './tickets-resilience.js';
import {
  isDefinitiveTicketsError,
  type TicketWriteResult,
  type TicketWriterApi,
  writeToTickets,
} from './ticket-writer.js';

export type { ConfirmPendingActionResult };

export type ConfirmPendingActionDeps = {
  actions: PendingActionRepository;
  messages: MessageRepository;
  tickets: TicketWriterApi;
  clock: Clock;
  policy?: ResiliencePolicy;
};

export type ConfirmPendingActionInput = PendingActionTarget & {
  via: ConfirmationChannel;
  messageId?: string;
};

export class ConfirmPendingAction {
  constructor(private readonly deps: ConfirmPendingActionDeps) {}

  async execute(input: ConfirmPendingActionInput): Promise<ConfirmPendingActionResult> {
    const record = await requirePendingAction(this.deps.actions, input);
    const startedAt = this.deps.clock.now();
    const written = await this.write(input, record);
    const finishedAt = this.deps.clock.now();
    const result = buildConfirmationResult({
      messageId: input.messageId ?? randomUUID(),
      record,
      via: input.via,
      written,
      startedAt,
      finishedAt,
    });
    await this.deps.actions.save(result.action);
    await this.deps.messages.save(result.message);
    return result;
  }

  private async write(
    input: ConfirmPendingActionInput,
    record: PendingActionRecord,
  ): Promise<TicketWriteResult> {
    const policy = this.deps.policy ?? TICKETS_RESILIENCE_POLICY;
    try {
      const requesterId = input.conversation.employeeId;
      return await writeToTickets({ tickets: this.deps.tickets, policy }, { requesterId, record });
    } catch (error: unknown) {
      await this.failWhenFinal(record, error);
      throw error;
    }
  }

  private async failWhenFinal(record: PendingActionRecord, error: unknown): Promise<void> {
    if (isDefinitiveTicketsError(error)) {
      const resolvedAt = this.deps.clock.now().toISOString();
      await this.deps.actions.save({ ...record, status: 'failed', resolvedAt });
    }
  }
}
