import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { buildButtonHandoffSummary } from './button-handoff-summary.js';
import type { HandOffConversation } from './hand-off-conversation.js';

const NO_ACTIVE_CONVERSATION_MESSAGE = 'Não há conversa ativa para transferir.';
const SUMMARY_MESSAGES_LIMIT = 20;

export type RequestHandoffInput = {
  employeeId: string;
};

export class RequestHandoff {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly messages: MessageRepository,
    private readonly handOff: HandOffConversation,
  ) {}

  async execute(input: RequestHandoffInput): Promise<Conversation> {
    const conversation = await this.conversations.findActiveByEmployee(input.employeeId);
    if (conversation === null) {
      throw new ChatRuleError('not_found', NO_ACTIVE_CONVERSATION_MESSAGE);
    }
    const recent = await this.messages.listRecent({
      conversationId: conversation.id,
      limit: SUMMARY_MESSAGES_LIMIT,
    });
    const built = buildButtonHandoffSummary(recent);
    return this.handOff.execute({ conversation, reason: 'requested', ...built });
  }
}
