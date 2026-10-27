import type { AgentApi } from '@nexo/contracts';
import type { MessageAllowance } from '../allowance/message-allowance.js';
import type { Clock } from '../clock/clock.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import type { HandOffConversation } from '../handoff/hand-off-conversation.js';
import type { MessageRepository } from '../messages/message-repository.js';
import type { ConversationNotifier } from '../notifier/conversation-notifier.js';
import type { ConfirmPendingAction } from '../pending-actions/confirm-pending-action.js';
import type { PendingActionRepository } from '../pending-actions/pending-action-repository.js';
import type { PendingActions } from '../pending-actions/pending-actions.js';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';

export type EmployeeTurnDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  actions: PendingActionRepository;
  allowance: MessageAllowance;
  pendingActions: Pick<PendingActions, 'propose' | 'cancel'>;
  confirm: Pick<ConfirmPendingAction, 'execute'>;
  agent: AgentApi;
  handOff: Pick<HandOffConversation, 'execute'>;
  notifier: ConversationNotifier;
  views: ConversationViewBuilder;
  clock: Clock;
};
