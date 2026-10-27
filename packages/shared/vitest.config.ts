import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const PGLITE_TEST_TIMEOUT_MS = 120_000;

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: PGLITE_TEST_TIMEOUT_MS,
    hookTimeout: PGLITE_TEST_TIMEOUT_MS,
  },
});
