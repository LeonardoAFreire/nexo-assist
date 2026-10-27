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
    const readAt = this.clock.now().toISOString();
    const read = await this.conversations.markAnalystRead(conversationId, readAt);
    if (read === null) {
      throw new ChatRuleError('not_found', NOT_FOUND_MESSAGE);
    }
    await this.notifier.conversationUpdated(read);
  }
}
