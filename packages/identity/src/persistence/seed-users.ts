import { DEMO_PEOPLE } from '@nexo/contracts';
import type { Database } from '@nexo/shared/database';
import { isNotNull } from 'drizzle-orm';
import type { PasswordHasher } from '../core/password-hasher.js';
import { usersTable } from './users.table.js';

type SeedUsersInput = {
  hasher: PasswordHasher;
  password: string;
};

async function findUsersWithPassword(database: Database): Promise<Set<string>> {
  const rows = await database
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(isNotNull(usersTable.passwordHash));
  return new Set(rows.map((row) => row.id));
}

export async function seedUsers(database: Database, input: SeedUsersInput): Promise<void> {
  const withPassword = await findUsersWithPassword(database);
  const pending = DEMO_PEOPLE.filter((person) => !withPassword.has(person.id));
  for (const person of pending) {
    const passwordHash = await input.hasher.hash(input.password);
    await database
      .insert(usersTable)
      .values({ ...person, passwordHash })
      .onConflictDoUpdate({ target: usersTable.id, set: { passwordHash } });
  }
}
