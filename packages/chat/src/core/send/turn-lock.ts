import type { Clock } from '../clock/clock.js';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import { ChatRuleError } from '../errors/chat-rule.error.js';

const TURN_LOCK_MS = 120_000;
const TURN_IN_PROGRESS_MESSAGE =
  'Ainda estou respondendo à mensagem anterior. Aguarde um instante.';

export class TurnLock {
  constructor(
    private readonly conversations: Pick<
      ConversationRepository,
      'acquireTurnLock' | 'releaseTurnLock'
    >,
    private readonly clock: Clock,
  ) {}

  expiresAt(): string {
    return new Date(this.clock.now().getTime() + TURN_LOCK_MS).toISOString();
  }

  async acquire(conversationId: string): Promise<Conversation> {
    const now = this.clock.now().toISOString();
    const until = this.expiresAt();
    const locked = await this.conversations.acquireTurnLock({ conversationId, now, until });
    if (locked === null) {
      throw new ChatRuleError('turn_in_progress', TURN_IN_PROGRESS_MESSAGE);
    }
    return locked;
  }

  async release(conversationId: string): Promise<void> {
    await this.conversations.releaseTurnLock(conversationId);
  }
}
