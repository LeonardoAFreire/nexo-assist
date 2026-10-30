import { DEMO_PEOPLE } from '@nexo/contracts';
import { runMigrations } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PasswordHasher } from '../core/password-hasher.js';
import { seedUsers } from './seed-users.js';
import { IDENTITY_SCHEMA, usersTable } from './users.table.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../drizzle`;
const OLD_PASSWORD = 'senha-antiga-de-teste';
const NEW_PASSWORD = 'senha-nova-de-teste';

let testDatabase: TestDatabase;
let hashed: string[];

const hasher: PasswordHasher = {
  hash: async (plain) => {
    hashed.push(plain);
    return `hash:${plain}`;
  },
  verify: async (plain, hash) => hash === `hash:${plain}`,
};

async function storedHashes(): Promise<(string | null)[]> {
  const rows = await testDatabase.database.select().from(usersTable);
  return rows.map((row) => row.passwordHash);
}

beforeEach(async () => {
  hashed = [];
  testDatabase = await createTestDatabase();
  const options = { folder: MIGRATIONS_FOLDER, schema: IDENTITY_SCHEMA };
  await runMigrations(testDatabase.database, options);
});

afterEach(async () => {
  await testDatabase.close();
});

describe('seedUsers', () => {
  it('cria as pessoas de exemplo com o hash da senha configurada', async () => {
    await seedUsers(testDatabase.database, { hasher, password: OLD_PASSWORD });
    expect(await storedHashes()).toEqual(DEMO_PEOPLE.map(() => `hash:${OLD_PASSWORD}`));
  });

  it('troca o hash de todos quando a senha configurada muda, e a antiga deixa de valer', async () => {
    await seedUsers(testDatabase.database, { hasher, password: OLD_PASSWORD });
    await seedUsers(testDatabase.database, { hasher, password: NEW_PASSWORD });
    const hashes = await storedHashes();
    expect(hashes).toHaveLength(DEMO_PEOPLE.length);
    expect(new Set(hashes)).toEqual(new Set([`hash:${NEW_PASSWORD}`]));
  });

  it('não refaz o hash quando a senha guardada já é a configurada', async () => {
    await seedUsers(testDatabase.database, { hasher, password: OLD_PASSWORD });
    hashed = [];
    await seedUsers(testDatabase.database, { hasher, password: OLD_PASSWORD });
    expect(hashed).toEqual([]);
  });
});
