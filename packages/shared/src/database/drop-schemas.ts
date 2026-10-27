import { sql } from 'drizzle-orm';
import type { Database } from './database.tokens.js';

export async function dropSchemas(database: Database, schemas: readonly string[]): Promise<void> {
  for (const schema of schemas) {
    await database.execute(sql`drop schema if exists ${sql.identifier(schema)} cascade`);
  }
}
