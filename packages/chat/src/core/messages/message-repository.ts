import type { ChatMessage } from '@nexo/contracts';

export type ListRecentMessagesInput = {
  conversationId: string;
  limit: number;
};

export type ListRecentByConversationsInput = {
  conversationIds: string[];
  limit: number;
};

export interface MessageRepository {
  save(message: ChatMessage): Promise<void>;
  findById(id: string): Promise<ChatMessage | null>;
  listRecent(input: ListRecentMessagesInput): Promise<ChatMessage[]>;
  listRecentByConversations(input: ListRecentByConversationsInput): Promise<ChatMessage[]>;
}
