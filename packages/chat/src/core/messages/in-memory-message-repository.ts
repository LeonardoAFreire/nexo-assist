import type { ChatMessage } from '@nexo/contracts';
import type { ListRecentMessagesInput, MessageRepository } from './message-repository.js';

export class InMemoryMessageRepository implements MessageRepository {
  private readonly stored = new Map<string, ChatMessage>();

  async save(message: ChatMessage): Promise<void> {
    this.stored.set(message.id, message);
  }

  async findById(id: string): Promise<ChatMessage | null> {
    return this.stored.get(id) ?? null;
  }

  async listRecent(input: ListRecentMessagesInput): Promise<ChatMessage[]> {
    const ofConversation = [...this.stored.values()]
      .filter((message) => message.conversationId === input.conversationId)
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
    return ofConversation.slice(-input.limit);
  }
}
