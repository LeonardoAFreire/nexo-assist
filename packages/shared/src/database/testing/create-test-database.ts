import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { Database } from '../database.tokens.js';

export type TestDatabase = {
  database: Database;
  close: () => Promise<void>;
};

export async function createTestDatabase(): Promise<TestDatabase> {
  const client = new PGlite();
  await client.waitReady;
  const database: Database = drizzle({ client });
  return { database, close: () => client.close() };
}
