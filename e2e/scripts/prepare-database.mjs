import { spawnSync } from 'node:child_process';
import pg from 'pg';

const ADMIN_DATABASE = 'postgres';

async function ensureDatabaseExists(databaseUrl) {
  const target = new URL(databaseUrl);
  const databaseName = decodeURIComponent(target.pathname.slice(1));
  const admin = new URL(databaseUrl);
  admin.pathname = `/${ADMIN_DATABASE}`;
  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const found = await client.query('select 1 from pg_database where datname = $1', [databaseName]);
  if (found.rowCount === 0) {
    await client.query(`create database "${databaseName.replaceAll('"', '""')}"`);
  }
  await client.end();
}

function resetDatabase() {
  const result = spawnSync('pnpm', ['--filter', '@nexo/monolith', 'db:reset'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await ensureDatabaseExists(process.env.DATABASE_URL);
resetDatabase();
