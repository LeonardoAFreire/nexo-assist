import { sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dropSchemas } from './drop-schemas.js';
import { runMigrations } from './run-migrations.js';
import { createTestDatabase, type TestDatabase } from './testing/index.js';

const exampleMigrations = {
  folder: `${import.meta.dirname}/fixtures/example-migrations`,
  schema: 'example',
};

async function schemaExists(testDatabase: TestDatabase, schema: string): Promise<boolean> {
  const result = await testDatabase.database.execute(
    sql`select 1 as found from information_schema.schemata where schema_name = ${schema}`,
  );
  const { rows } = result as unknown as { rows: unknown[] };
  return rows.length > 0;
}

describe('dropSchemas', () => {
  let testDatabase: TestDatabase;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
  });

  afterEach(async () => {
    await testDatabase.close();
  });

  it('remove o schema com suas tabelas e permite recriá-lo pelas migrations', async () => {
    await runMigrations(testDatabase.database, exampleMigrations);
    await dropSchemas(testDatabase.database, ['example']);
    expect(await schemaExists(testDatabase, 'example')).toBe(false);
    await runMigrations(testDatabase.database, exampleMigrations);
    expect(await schemaExists(testDatabase, 'example')).toBe(true);
  });

  it('ignora schemas que não existem', async () => {
    await expect(dropSchemas(testDatabase.database, ['inexistente'])).resolves.toBeUndefined();
  });
});
