import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { Database } from './database.tokens.js';

const MIGRATIONS_TABLE = '__migrations';

export type RunMigrationsOptions = {
  folder: string;
  schema: string;
};

function asMigratable(database: Database): NodePgDatabase {
  return database as unknown as NodePgDatabase;
}

export async function runMigrations(
  database: Database,
  options: RunMigrationsOptions,
): Promise<void> {
  await migrate(asMigratable(database), {
    migrationsFolder: options.folder,
    migrationsSchema: options.schema,
    migrationsTable: MIGRATIONS_TABLE,
  });
}
