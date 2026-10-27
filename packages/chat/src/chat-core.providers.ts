import type { Provider } from '@nestjs/common';
import {
  AGENT_API,
  type AgentApi,
  IDENTITY_API,
  type IdentityApi,
  TICKETS_API,
  type TicketsApi,
} from '@nexo/contracts';
import { EventPublisher } from '@nexo/shared/events';
import { MessageAllowance } from './core/allowance/message-allowance.js';
import { buildChatCore, type ChatCore } from './core/chat-core.js';
import { CLOCK, type Clock } from './core/clock/clock.js';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from './core/conversation/conversation-repository.js';
import { ConversationEventsHub } from './core/events/conversation-events-hub.js';
import { MESSAGE_REPOSITORY, type MessageRepository } from './core/messages/message-repository.js';
import { EmployeePendingActions } from './core/pending-actions/employee-pending-actions.js';
import {
  PENDING_ACTION_REPOSITORY,
  type PendingActionRepository,
} from './core/pending-actions/pending-action-repository.js';
import { RetryEmployeeTurn } from './core/send/retry-employee-turn.js';
import { SendEmployeeMessage } from './core/send/send-employee-message.js';
import { GetEmployeeConversation } from './core/timeline/get-employee-conversation.js';

const CHAT_CORE = Symbol('CHAT_CORE');

type CoreDependencies = [
  ConversationRepository,
  MessageRepository,
  PendingActionRepository,
  MessageAllowance,
  IdentityApi,
  TicketsApi,
  AgentApi,
  EventPublisher,
  ConversationEventsHub,
  Clock,
];

const chatCoreProvider: Provider = {
  provide: CHAT_CORE,
  inject: [
    CONVERSATION_REPOSITORY,
    MESSAGE_REPOSITORY,
    PENDING_ACTION_REPOSITORY,
    MessageAllowance,
    IDENTITY_API,
    TICKETS_API,
    AGENT_API,
    EventPublisher,
    ConversationEventsHub,
    CLOCK,
  ],
  useFactory: (...resolved: CoreDependencies): ChatCore => {
    const [conversations, messages, actions, allowance, identity] = resolved;
    const [, , , , , tickets, agent, events, hub, clock] = resolved;
    return buildChatCore({
      conversations,
      messages,
      actions,
      allowance,
      identity,
      tickets,
      agent,
      events,
      hub,
      clock,
    });
  },
};

function fromCore<T>(token: new (...args: never[]) => T, pick: (core: ChatCore) => T): Provider {
  return { provide: token, inject: [CHAT_CORE], useFactory: pick };
}

export const CHAT_CORE_PROVIDERS: Provider[] = [
  chatCoreProvider,
  fromCore(GetEmployeeConversation, (core) => core.getConversation),
  fromCore(SendEmployeeMessage, (core) => core.sendMessage),
  fromCore(RetryEmployeeTurn, (core) => core.retryTurn),
  fromCore(EmployeePendingActions, (core) => core.employeeActions),
];
