import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { pingDatabase } from './ping-database.js';
import { runMigrations } from './run-migrations.js';
import { createTestDatabase, type TestDatabase } from './testing/index.js';

const exampleMigrations = {
  folder: `${import.meta.dirname}/fixtures/example-migrations`,
  schema: 'example',
};

async function countRows(testDatabase: TestDatabase, table: string): Promise<number> {
  const result = await testDatabase.database.execute(
    sql`select count(*)::int as total from ${sql.raw(table)}`,
  );
  const { rows } = result as unknown as { rows: { total: number }[] };
  return Number(rows[0]?.total);
}

describe('runMigrations', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('aplica as migrations do schema uma única vez ao rodar duas vezes', async () => {
    await runMigrations(testDatabase.database, exampleMigrations);
    await runMigrations(testDatabase.database, exampleMigrations);
    expect(await countRows(testDatabase, 'example.__migrations')).toBe(1);
    expect(await countRows(testDatabase, 'example.items')).toBe(0);
  });

  it('responde ao ping quando o banco está disponível', async () => {
    await expect(pingDatabase(testDatabase.database)).resolves.toBeUndefined();
  });
});
