import type { IncrementUsageInput, SessionUsageRepository } from './session-usage-repository.js';

export class InMemorySessionUsageRepository implements SessionUsageRepository {
  private readonly counters = new Map<string, number>();

  async countFor(sessionId: string): Promise<number> {
    return this.counters.get(sessionId) ?? 0;
  }

  async incrementBelowLimit(input: IncrementUsageInput): Promise<number | null> {
    const current = this.counters.get(input.sessionId) ?? 0;
    if (current >= input.limit) {
      return null;
    }
    this.counters.set(input.sessionId, current + 1);
    return current + 1;
  }
}
