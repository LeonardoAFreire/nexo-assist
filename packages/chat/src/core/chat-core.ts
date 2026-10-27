import type { AgentApi, IdentityApi, TicketsApi } from '@nexo/contracts';
import type { MessageAllowance } from './allowance/message-allowance.js';
import type { Clock } from './clock/clock.js';
import type { ConversationRepository } from './conversation/conversation-repository.js';
import type { ConversationEventsHub } from './events/conversation-events-hub.js';
import {
  HandOffConversation,
  type HandoffEventPublisher,
} from './handoff/hand-off-conversation.js';
import { HandoffPolicy } from './handoff/handoff-policy.js';
import type { MessageRepository } from './messages/message-repository.js';
import { ConversationNotifier } from './notifier/conversation-notifier.js';
import { ConfirmPendingAction } from './pending-actions/confirm-pending-action.js';
import { EditPendingAction } from './pending-actions/edit-pending-action.js';
import { EmployeePendingActions } from './pending-actions/employee-pending-actions.js';
import type { PendingActionRepository } from './pending-actions/pending-action-repository.js';
import { PendingActions } from './pending-actions/pending-actions.js';
import { RetryEmployeeTurn } from './send/retry-employee-turn.js';
import { SendEmployeeMessage } from './send/send-employee-message.js';
import { GetEmployeeConversation } from './timeline/get-employee-conversation.js';
import { TimelineBuilder } from './timeline/timeline-builder.js';
import { ConversationViewBuilder } from './view/conversation-view-builder.js';

export type ChatCoreDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  actions: PendingActionRepository;
  allowance: MessageAllowance;
  identity: IdentityApi;
  tickets: TicketsApi;
  agent: AgentApi;
  events: HandoffEventPublisher;
  hub: ConversationEventsHub;
  clock: Clock;
};

export type ChatCore = {
  getConversation: GetEmployeeConversation;
  sendMessage: SendEmployeeMessage;
  retryTurn: RetryEmployeeTurn;
  employeeActions: EmployeePendingActions;
};

function buildCollaborators(deps: ChatCoreDeps) {
  const { conversations, messages, actions, tickets, clock } = deps;
  const views = new ConversationViewBuilder(deps.identity, actions);
  const notifier = new ConversationNotifier(deps.hub, views);
  const policy = new HandoffPolicy(tickets);
  const handOff = new HandOffConversation({
    conversations,
    messages,
    policy,
    events: deps.events,
    notifier,
    clock,
  });
  const pendingActions = new PendingActions(actions, tickets, clock);
  const confirm = new ConfirmPendingAction({ actions, messages, tickets, clock });
  return { views, notifier, handOff, pendingActions, confirm };
}

export function buildChatCore(deps: ChatCoreDeps): ChatCore {
  const collaborators = buildCollaborators(deps);
  const { views, notifier, pendingActions, confirm } = collaborators;
  const turnDeps = { ...deps, ...collaborators };
  const timeline = new TimelineBuilder(deps.actions);
  const edit = new EditPendingAction(deps.actions, deps.tickets);
  return {
    getConversation: new GetEmployeeConversation({ ...deps, views, timeline }),
    sendMessage: new SendEmployeeMessage(turnDeps),
    retryTurn: new RetryEmployeeTurn(turnDeps),
    employeeActions: new EmployeePendingActions({
      ...deps,
      edit,
      confirm,
      pendingActions,
      notifier,
      views,
    }),
  };
}
