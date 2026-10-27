import type { UserRecord } from './user-record.js';
import type { UserRepository } from './user-repository.js';

export class InMemoryUserRepository implements UserRepository {
  constructor(private readonly records: readonly UserRecord[]) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.records.find((record) => record.email === email) ?? null;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    return this.records.find((record) => record.id === userId) ?? null;
  }

  async findByIds(userIds: string[]): Promise<UserRecord[]> {
    return this.records.filter((record) => userIds.includes(record.id));
  }
}
