import { Inject, Injectable } from '@nestjs/common';
import { Conversation } from '../core/conversation/conversation.js';
import {
  CONVERSATION_REPOSITORY,
  type ConversationRepository,
} from '../core/conversation/conversation-repository.js';
import { MESSAGE_REPOSITORY, type MessageRepository } from '../core/messages/message-repository.js';
import type { SeedConversation } from './seed/seed-factories.js';

@Injectable()
export class ConsoleSeedStore {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    @Inject(MESSAGE_REPOSITORY) private readonly messages: MessageRepository,
  ) {}

  async isEmpty(): Promise<boolean> {
    const existing = await this.conversations.listAll();
    return existing.length === 0;
  }

  async store(entry: SeedConversation): Promise<void> {
    await this.conversations.save(new Conversation(entry.conversation));
    for (const message of entry.messages) {
      await this.messages.save(message);
    }
  }
}
