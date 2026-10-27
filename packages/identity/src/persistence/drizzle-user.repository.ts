import { eq, inArray } from 'drizzle-orm';
import type { Database } from '@nexo/shared/database';
import type { UserRecord } from '../core/user-record.js';
import type { UserRepository } from '../core/user-repository.js';
import { usersTable } from './users.table.js';

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly database: Database) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.database.select().from(usersTable).where(eq(usersTable.email, email));
    return rows[0] ?? null;
  }

  async findById(userId: string): Promise<UserRecord | null> {
    const rows = await this.database.select().from(usersTable).where(eq(usersTable.id, userId));
    return rows[0] ?? null;
  }

  async findByIds(userIds: string[]): Promise<UserRecord[]> {
    if (userIds.length === 0) {
      return [];
    }
    return this.database.select().from(usersTable).where(inArray(usersTable.id, userIds));
  }
}
