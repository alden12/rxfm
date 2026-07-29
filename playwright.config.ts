import { defineConfig, devices } from '@playwright/test';

// E2E tests run against the Vite dev server (started automatically below).
export default defineConfig({
  testDir: './e2e',
  // Run serially: the demo is served by the Vite dev server, which compiles each `.rts`
  // route on first request (the reactive-ts transform). Parallel workers just contend on
  // that single server and time out on a cold start, so one worker is both faster here and
  // far less flaky (especially on CI, where the server always starts cold).
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // A dedicated, fixed port for e2e (the interactive dev server uses 3001, and 3000 is
  // often taken by another app). `--strictPort` makes Vite fail loudly if 3100 is busy
  // rather than silently drifting to another port, so tests never run against an
  // unrelated server that happens to be listening.
  webServer: {
    command: 'yarn dev --port 3100 --strictPort',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
