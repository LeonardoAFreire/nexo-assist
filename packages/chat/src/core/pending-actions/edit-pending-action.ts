import type { EditPendingActionRequest, TicketDraft, TicketsApi } from '@nexo/contracts';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import { reassessDraft } from './draft-assessment.js';
import type { PendingActionRecord } from './pending-action-record.js';
import type { PendingActionRepository } from './pending-action-repository.js';
import { type PendingActionTarget, requirePendingAction } from './require-pending-action.js';

const NOT_EDITABLE_MESSAGE = 'Só é possível editar o rascunho de um novo chamado.';

export type EditPendingActionInput = PendingActionTarget & {
  changes: EditPendingActionRequest;
};

export class EditPendingAction {
  constructor(
    private readonly repository: PendingActionRepository,
    private readonly tickets: Pick<TicketsApi, 'assessPriority'>,
  ) {}

  async execute(input: EditPendingActionInput): Promise<PendingActionRecord> {
    const record = await requirePendingAction(this.repository, input);
    if (record.kind !== 'create_ticket' || record.draft === null) {
      throw new ChatRuleError('validation_error', NOT_EDITABLE_MESSAGE);
    }
    const draft = await reassessDraft(this.tickets, applyChanges(record.draft, input.changes));
    const edited = { ...record, draft };
    await this.repository.save(edited);
    return edited;
  }
}

function applyChanges(draft: TicketDraft, changes: EditPendingActionRequest): TicketDraft {
  const affected = changes.affected ?? draft.affected;
  return {
    ...draft,
    title: changes.title ?? draft.title,
    description: changes.description ?? draft.description,
    category: changes.category ?? draft.category,
    affected,
    priorityFacts: { ...draft.priorityFacts, impact: affected },
  };
}
