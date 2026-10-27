import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const COVERAGE_THRESHOLD_PERCENT = 80;

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    include: ['src/**/*.test.ts'],
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
