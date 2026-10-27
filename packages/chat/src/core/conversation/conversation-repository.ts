import type { ConversationState } from '@nexo/contracts';
import type { Conversation } from './conversation.js';

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

export type AcquireTurnLockInput = {
  conversationId: string;
  now: string;
  until: string;
};

export type SaveWhenStateInput = {
  conversation: Conversation;
  expectedState: ConversationState;
};

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findActiveByEmployee(employeeId: string): Promise<Conversation | null>;
  listByEmployee(employeeId: string): Promise<Conversation[]>;
  listAll(): Promise<Conversation[]>;
  save(conversation: Conversation): Promise<void>;
  saveWhenState(input: SaveWhenStateInput): Promise<boolean>;
  acquireTurnLock(input: AcquireTurnLockInput): Promise<Conversation | null>;
  releaseTurnLock(conversationId: string): Promise<void>;
}
