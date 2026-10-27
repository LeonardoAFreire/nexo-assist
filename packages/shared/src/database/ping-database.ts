import { sql } from 'drizzle-orm';
import type { Database } from './database.tokens.js';

export async function pingDatabase(database: Database): Promise<void> {
  await database.execute(sql`select 1`);
}
