import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const INTEGRATION_TEST_TIMEOUT_MS = 20_000;
const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../..');

export default defineConfig({
  envDir: REPOSITORY_ROOT,
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    env: { VITE_API_URL: 'http://localhost:3000/api' },
    testTimeout: INTEGRATION_TEST_TIMEOUT_MS,
  },
});
