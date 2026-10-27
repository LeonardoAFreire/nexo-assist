import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/persistence/conversations.table.ts',
    './src/persistence/messages.table.ts',
    './src/persistence/pending-actions.table.ts',
    './src/persistence/session-usage.table.ts',
  ],
  out: './drizzle',
  schemaFilter: ['chat'],
});
