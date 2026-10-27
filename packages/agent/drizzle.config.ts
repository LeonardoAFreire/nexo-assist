import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/persistence/agent-runs.table.ts'],
  out: './drizzle',
  schemaFilter: ['agent'],
});
