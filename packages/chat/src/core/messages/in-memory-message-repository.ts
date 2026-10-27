import type { ChatMessage } from '@nexo/contracts';
import type {
  ListRecentByConversationsInput,
  ListRecentMessagesInput,
  MessageRepository,
} from './message-repository.js';

export class InMemoryMessageRepository implements MessageRepository {
  private readonly stored = new Map<string, ChatMessage>();

  async save(message: ChatMessage): Promise<void> {
    this.stored.set(message.id, message);
  }

  async findById(id: string): Promise<ChatMessage | null> {
    return this.stored.get(id) ?? null;
  }

  async listRecent(input: ListRecentMessagesInput): Promise<ChatMessage[]> {
    return this.recentOf([input.conversationId], input.limit);
  }

  async listRecentByConversations(input: ListRecentByConversationsInput): Promise<ChatMessage[]> {
    return this.recentOf(input.conversationIds, input.limit);
  }

  private recentOf(conversationIds: string[], limit: number): ChatMessage[] {
    const selected = [...this.stored.values()]
      .filter((message) => conversationIds.includes(message.conversationId))
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
    return selected.slice(-limit);
  }
}
