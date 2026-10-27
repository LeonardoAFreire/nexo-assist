import type { Clock } from '../clock/clock.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';
import type { ConversationNotifier } from '../notifier/conversation-notifier.js';

const NOT_FOUND_MESSAGE = 'Conversa não encontrada.';

export class MarkConversationRead {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly notifier: ConversationNotifier,
    private readonly clock: Clock,
  ) {}

  async execute(conversationId: string): Promise<void> {
    const conversation = await this.conversations.findById(conversationId);
    if (conversation === null) {
      throw new ChatRuleError('not_found', NOT_FOUND_MESSAGE);
    }
    const read = conversation.withChanges({ analystReadAt: this.clock.now().toISOString() });
    await this.conversations.save(read);
    await this.notifier.conversationUpdated(read);
  }
}
