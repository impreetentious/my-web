import { defineConfig, devices } from '@playwright/test';

const PORT = 3008;
const BASE = `http://127.0.0.1:${PORT}`;

// End-to-end runs against the built export served by `serve`, not the dev server,
// so the suite exercises the same bytes the host will publish.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
