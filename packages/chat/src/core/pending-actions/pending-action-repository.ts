import type { PendingActionRecord } from './pending-action-record.js';

export interface PendingActionRepository {
  nextDisplayNumber(): Promise<string>;
  save(record: PendingActionRecord): Promise<void>;
  findById(id: string): Promise<PendingActionRecord | null>;
  findPendingByConversation(conversationId: string): Promise<PendingActionRecord | null>;
}
