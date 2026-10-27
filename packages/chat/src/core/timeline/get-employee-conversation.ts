import type { EmployeeConversationView } from '@nexo/contracts';
import type { MessageAllowance } from '../allowance/message-allowance.js';
import type { Clock } from '../clock/clock.js';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import type { MessageRepository } from '../messages/message-repository.js';
import type { ConversationViewBuilder } from '../view/conversation-view-builder.js';
import { EMPLOYEE_TIMELINE_LIMIT, type TimelineBuilder } from './timeline-builder.js';

export type GetEmployeeConversationDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  allowance: Pick<MessageAllowance, 'current'>;
  views: ConversationViewBuilder;
  timeline: TimelineBuilder;
  clock: Clock;
};

export type GetEmployeeConversationInput = {
  employeeId: string;
  sessionId: string;
};

export class GetEmployeeConversation {
  constructor(private readonly deps: GetEmployeeConversationDeps) {}

  async execute(input: GetEmployeeConversationInput): Promise<EmployeeConversationView> {
    const all = await this.deps.conversations.listByEmployee(input.employeeId);
    const messages = await this.deps.messages.listRecentByConversations({
      conversationIds: all.map((conversation) => conversation.id),
      limit: EMPLOYEE_TIMELINE_LIMIT,
    });
    const active = all.find((conversation) => conversation.state !== 'closed') ?? null;
    const usage = await this.deps.allowance.current(input.sessionId);
    return {
      conversation: active === null ? null : await this.deps.views.build(active),
      timeline: await this.deps.timeline.refreshPendingActions(messages),
      usage: { messagesUsed: usage.messagesUsed, messagesLimit: usage.messagesLimit },
      turnInProgress: active !== null && this.isLocked(active),
    };
  }

  private isLocked(conversation: Conversation): boolean {
    const lockUntil = conversation.props.turnLockUntil;
    return lockUntil !== null && lockUntil > this.deps.clock.now().toISOString();
  }
}
