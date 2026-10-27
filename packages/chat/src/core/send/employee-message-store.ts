import type { MessageUsage } from '@nexo/contracts';
import type { Conversation } from '../conversation/conversation.js';
import { buildEmployeeMessage } from './employee-message.js';
import type { ResolvedText } from './employee-text-resolver.js';
import type { EmployeeTurnDeps } from './employee-turn-deps.js';
import type { EmployeeSession, TurnContext } from './turn-context.js';

export type StoreEmployeeMessageInput = {
  conversation: Conversation;
  session: EmployeeSession;
  resolved: ResolvedText;
  usage: MessageUsage;
  signal: AbortSignal;
};

export class EmployeeMessageStore {
  constructor(private readonly deps: EmployeeTurnDeps) {}

  async store(input: StoreEmployeeMessageInput): Promise<TurnContext> {
    const createdAt = this.deps.clock.now().toISOString();
    const message = buildEmployeeMessage({
      conversationId: input.conversation.id,
      authorName: input.session.userName,
      text: input.resolved.text,
      createdAt,
    });
    const conversation = input.conversation.withChanges({ lastMessageAt: createdAt });
    await this.deps.conversations.save(conversation);
    await this.deps.messages.save(message);
    if (input.resolved.answered !== null) {
      await this.deps.messages.save(input.resolved.answered);
    }
    this.deps.notifier.messageCreated({ conversation, message });
    await this.deps.notifier.conversationUpdated(conversation);
    return {
      session: input.session,
      conversation,
      employeeMessage: message,
      agentText: input.resolved.agentText,
      usage: {
        messagesUsed: input.usage.messagesUsed,
        messagesLimit: input.usage.messagesLimit,
      },
      signal: input.signal,
    };
  }
}
