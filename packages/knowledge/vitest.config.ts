import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const COVERAGE_THRESHOLD_PERCENT = 80;

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['src/**/*.test.ts'],
    env: {
      LLM_PROVIDER: 'scripted',
      WEB_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'test-secret-with-at-least-32-characters',
      DATABASE_URL: 'postgres://nexo:nexo@localhost:5432/nexo',
    },
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/**/*.test.ts', 'src/core/**/testing/**'],
      thresholds: {
        lines: COVERAGE_THRESHOLD_PERCENT,
        branches: COVERAGE_THRESHOLD_PERCENT,
      },
    },
  },
});
