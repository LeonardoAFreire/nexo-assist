import { randomUUID } from 'node:crypto';
import type { ChatMessage, UserProfile } from '@nexo/contracts';
import {
  type AnalystActionDeps,
  assertAssignedTo,
  requireConversation,
} from './analyst-action-support.js';

export type SendAnalystMessageInput = {
  analyst: UserProfile;
  conversationId: string;
  text: string;
};

export class SendAnalystMessage {
  constructor(private readonly deps: AnalystActionDeps) {}

  async execute(input: SendAnalystMessageInput): Promise<ChatMessage> {
    const conversation = await requireConversation(this.deps.conversations, input.conversationId);
    assertAssignedTo(conversation, input.analyst.id);
    const createdAt = this.deps.clock.now().toISOString();
    const message: ChatMessage = {
      id: randomUUID(),
      conversationId: conversation.id,
      author: 'analyst',
      authorName: input.analyst.name,
      authorLevel: input.analyst.supportLevel,
      text: input.text,
      parts: [],
      turn: null,
      status: 'complete',
      createdAt,
    };
    await this.deps.messages.save(message);
    const updated = conversation.withChanges({ lastMessageAt: createdAt });
    await this.deps.conversations.save(updated);
    this.deps.notifier.messageCreated({ conversation: updated, message });
    await this.deps.notifier.conversationUpdated(updated);
    return message;
  }
}
