import { DEMO_PEOPLE } from '@nexo/contracts';
import type { Database } from '@nexo/shared/database';
import type { PasswordHasher } from '../core/password-hasher.js';
import { usersTable } from './users.table.js';

type SeedUsersInput = {
  hasher: PasswordHasher;
  password: string;
};

async function loadPasswordHashes(database: Database): Promise<Map<string, string | null>> {
  const rows = await database
    .select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
    .from(usersTable);
  return new Map(rows.map((row) => [row.id, row.passwordHash]));
}

async function hasCurrentPassword(
  storedHash: string | null | undefined,
  input: SeedUsersInput,
): Promise<boolean> {
  if (storedHash === null || storedHash === undefined) {
    return false;
  }
  return input.hasher.verify(input.password, storedHash);
}

export async function seedUsers(database: Database, input: SeedUsersInput): Promise<void> {
  const storedHashes = await loadPasswordHashes(database);
  for (const person of DEMO_PEOPLE) {
    if (await hasCurrentPassword(storedHashes.get(person.id), input)) {
      continue;
    }
    const passwordHash = await input.hasher.hash(input.password);
    await database
      .insert(usersTable)
      .values({ ...person, passwordHash })
      .onConflictDoUpdate({ target: usersTable.id, set: { passwordHash } });
  }
}
