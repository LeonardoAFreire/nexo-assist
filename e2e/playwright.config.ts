import { defineConfig, devices } from '@playwright/test';
import {
  backendEnvironment,
  backendHealthUrl,
  webEnvironment,
  webOrigin,
  webPortNumber,
} from './support/environment.js';

const SERVER_START_TIMEOUT_MS = 120_000;
const EXPECT_TIMEOUT_MS = 15_000;
const TEST_TIMEOUT_MS = 60_000;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: TEST_TIMEOUT_MS,
  expect: { timeout: EXPECT_TIMEOUT_MS },
  reporter: [['list']],
  outputDir: './test-results',
  use: { baseURL: webOrigin, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/scripts/prepare-database.mjs && pnpm --filter @nexo/monolith start',
      cwd: '..',
      url: backendHealthUrl,
      env: backendEnvironment,
      reuseExistingServer: false,
      timeout: SERVER_START_TIMEOUT_MS,
    },
    {
      command: `pnpm --filter @nexo/web dev --port ${webPortNumber} --strictPort`,
      cwd: '..',
      url: webOrigin,
      env: webEnvironment,
      reuseExistingServer: false,
      timeout: SERVER_START_TIMEOUT_MS,
    },
  ],
});
