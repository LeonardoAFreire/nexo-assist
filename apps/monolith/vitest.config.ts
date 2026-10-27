import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const PGLITE_TEST_TIMEOUT_MS = 120_000;

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: PGLITE_TEST_TIMEOUT_MS,
    hookTimeout: PGLITE_TEST_TIMEOUT_MS,
    env: {
      LLM_PROVIDER: 'scripted',
      WEB_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
      DATABASE_URL: 'postgres://nexo:nexo@localhost:5432/nexo',
    },
  },
});
