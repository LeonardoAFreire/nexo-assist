import type { PendingActionRecord } from './pending-action-record.js';
import type { PendingActionRepository } from './pending-action-repository.js';

export class InMemoryPendingActionRepository implements PendingActionRepository {
  private readonly stored = new Map<string, PendingActionRecord>();
  private sequence = 0;

  async nextDisplayNumber(): Promise<string> {
    this.sequence += 1;
    return `D-${this.sequence}`;
  }

  async save(record: PendingActionRecord): Promise<void> {
    this.stored.set(record.id, record);
  }

  async findById(id: string): Promise<PendingActionRecord | null> {
    return this.stored.get(id) ?? null;
  }

  async findPendingByConversation(conversationId: string): Promise<PendingActionRecord | null> {
    const pending = [...this.stored.values()].find(
      (record) => record.conversationId === conversationId && record.status === 'pending',
    );
    return pending ?? null;
  }
}
