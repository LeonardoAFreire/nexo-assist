import type { Conversation } from './conversation.js';

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findActiveByEmployee(employeeId: string): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
}
