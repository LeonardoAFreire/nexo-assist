import type { Clock } from '../clock/clock.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import type { MessageRepository } from '../messages/message-repository.js';
import type { ConversationNotifier } from '../notifier/conversation-notifier.js';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';
import type { ConfirmPendingAction } from './confirm-pending-action.js';
import type { EditPendingAction } from './edit-pending-action.js';
import type { PendingActions } from './pending-actions.js';

export type EmployeePendingActionsDeps = {
  conversations: Pick<ConversationRepository, 'findActiveByEmployee' | 'save'>;
  messages: Pick<MessageRepository, 'save'>;
  edit: Pick<EditPendingAction, 'execute'>;
  confirm: Pick<ConfirmPendingAction, 'execute'>;
  pendingActions: Pick<PendingActions, 'cancel'>;
  notifier: ConversationNotifier;
  views: ConversationViewBuilder;
  clock: Clock;
};
