import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { Database } from '../database.tokens.js';

export type TestDatabase = {
  database: Database;
  close: () => Promise<void>;
};

export async function createTestDatabase(dataDirectory?: string): Promise<TestDatabase> {
  const client = new PGlite(dataDirectory);
  await client.waitReady;
  const database: Database = drizzle({ client });
  return { database, close: () => client.close() };
}
