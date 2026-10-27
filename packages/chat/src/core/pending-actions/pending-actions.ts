import { randomUUID } from 'node:crypto';
import type { TicketDraft, TicketsApi } from '@nexo/contracts';
import type { Clock } from '../clock/clock.js';
import { reassessDraft } from './draft-assessment.js';
import type { PendingActionProposal, PendingActionRecord } from './pending-action-record.js';
import type { PendingActionRepository } from './pending-action-repository.js';
import { type PendingActionTarget, requirePendingAction } from './require-pending-action.js';

const INCOMPLETE_PROPOSAL_MESSAGE = 'Proposta incompleta para o tipo de ação informado.';

export type ProposeInput = {
  conversationId: string;
  proposal: PendingActionProposal;
};

export class PendingActions {
  constructor(
    private readonly repository: PendingActionRepository,
    private readonly tickets: Pick<TicketsApi, 'assessPriority'>,
    private readonly clock: Clock,
  ) {}

  async propose(input: ProposeInput): Promise<PendingActionRecord> {
    assertComplete(input.proposal);
    const draft = await this.assessedDraft(input.proposal.draft);
    await this.supersedeCurrent(input.conversationId);
    const record: PendingActionRecord = {
      ...input.proposal,
      id: randomUUID(),
      conversationId: input.conversationId,
      displayNumber: await this.repository.nextDisplayNumber(),
      status: 'pending',
      draft,
      resultTicket: null,
      confirmedVia: null,
      createdAt: this.clock.now().toISOString(),
      resolvedAt: null,
    };
    await this.repository.save(record);
    return record;
  }

  async cancel(target: PendingActionTarget): Promise<PendingActionRecord> {
    const record = await requirePendingAction(this.repository, target);
    return this.resolve(record, 'cancelled');
  }

  private async assessedDraft(draft: TicketDraft | null): Promise<TicketDraft | null> {
    return draft === null ? null : reassessDraft(this.tickets, draft);
  }

  private async supersedeCurrent(conversationId: string): Promise<void> {
    const current = await this.repository.findPendingByConversation(conversationId);
    if (current !== null) {
      await this.resolve(current, 'superseded');
    }
  }

  private async resolve(
    record: PendingActionRecord,
    status: 'cancelled' | 'superseded',
  ): Promise<PendingActionRecord> {
    const resolved = { ...record, status, resolvedAt: this.clock.now().toISOString() };
    await this.repository.save(resolved);
    return resolved;
  }
}

function assertComplete(proposal: PendingActionProposal): void {
  const isComplete =
    proposal.kind === 'create_ticket'
      ? proposal.draft !== null
      : proposal.targetNumber !== null && proposal.complement !== null;
  if (!isComplete) {
    throw new Error(INCOMPLETE_PROPOSAL_MESSAGE);
  }
}
