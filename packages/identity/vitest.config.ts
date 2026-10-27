import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const COVERAGE_THRESHOLD_PERCENT = 80;

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['src/**/*.test.ts'],
    env: {
      WEB_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'segredo-de-teste-com-pelo-menos-32-caracteres',
      OPENROUTER_API_KEY: 'chave-ficticia-de-teste',
      DATABASE_URL: 'postgres://nexo:nexo@localhost:5432/nexo',
    },
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      exclude: ['src/core/**/*.test.ts'],
      thresholds: {
        lines: COVERAGE_THRESHOLD_PERCENT,
        branches: COVERAGE_THRESHOLD_PERCENT,
      },
    },
  },
});
