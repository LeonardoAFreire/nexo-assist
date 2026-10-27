import type { Clock } from '../clock/clock.js';
import type { Conversation } from '../conversation/conversation.js';
import type { ConversationRepository } from '../conversation/conversation-repository.js';
import type { MessageRepository } from '../messages/message-repository.js';
import { buildFailedMessage } from './turn-completion.js';
import { AgentTurnFailedError } from './turn-failure.js';

export type RecoverInterruptedTurnsDeps = {
  conversations: ConversationRepository;
  messages: MessageRepository;
  clock: Clock;
};

export class RecoverInterruptedTurns {
  constructor(private readonly deps: RecoverInterruptedTurnsDeps) {}

  async execute(): Promise<number> {
    const all = await this.deps.conversations.listAll();
    const locked = all.filter((conversation) => conversation.props.turnLockUntil !== null);
    for (const conversation of locked) {
      await this.recover(conversation);
    }
    return locked.length;
  }

  private async recover(conversation: Conversation): Promise<void> {
    await this.deps.conversations.releaseTurnLock(conversation.id);
    const recent = await this.deps.messages.listRecent({
      conversationId: conversation.id,
      limit: 1,
    });
    if (conversation.state !== 'agent' || recent.at(-1)?.author !== 'employee') {
      return;
    }
    await this.deps.messages.save(
      buildFailedMessage({
        conversationId: conversation.id,
        text: new AgentTurnFailedError('agent_unavailable', true).message,
        createdAt: this.deps.clock.now().toISOString(),
      }),
    );
  }
}
