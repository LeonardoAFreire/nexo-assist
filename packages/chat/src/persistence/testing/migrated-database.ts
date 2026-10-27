import { runMigrations } from '@nexo/shared/database';
import { createTestDatabase, type TestDatabase } from '@nexo/shared/database/testing';
import { CHAT_SCHEMA } from '../chat-schema.js';

const MIGRATIONS_FOLDER = `${import.meta.dirname}/../../../drizzle`;

export async function createMigratedDatabase(): Promise<TestDatabase> {
  const testDatabase = await createTestDatabase();
  await runMigrations(testDatabase.database, { folder: MIGRATIONS_FOLDER, schema: CHAT_SCHEMA });
  return testDatabase;
}
