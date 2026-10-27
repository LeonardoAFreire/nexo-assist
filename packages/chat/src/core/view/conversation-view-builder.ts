import type { Conversation as ConversationView } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import type { PendingActionRepository } from '../pending-actions/pending-action-repository.js';
import { toPendingAction } from '../pending-actions/to-pending-action.js';
import { loadProfiles, type ProfileLookup } from './load-profiles.js';

const EMPLOYEE_PROFILE_MISSING = 'Perfil do funcionário da conversa não encontrado.';

export class ConversationViewBuilder {
  constructor(
    private readonly identity: ProfileLookup,
    private readonly actions: Pick<PendingActionRepository, 'findPendingByConversation'>,
  ) {}

  async build(conversation: Conversation): Promise<ConversationView> {
    const { employeeId, assignedAnalystId } = conversation.props;
    const profiles = await loadProfiles(this.identity, [employeeId, assignedAnalystId]);
    const employee = profiles.get(employeeId);
    if (employee === undefined) {
      throw new Error(EMPLOYEE_PROFILE_MISSING);
    }
    const pending = await this.actions.findPendingByConversation(conversation.id);
    return {
      id: conversation.id,
      employee,
      state: conversation.state,
      resolution: conversation.props.resolution,
      assignedAnalyst: profiles.get(assignedAnalystId ?? '') ?? null,
      handoff: conversation.props.handoff,
      pendingAction: pending === null ? null : toPendingAction(pending),
      lastMessageAt: conversation.props.lastMessageAt,
    };
  }
}
