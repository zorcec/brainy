import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'packages/vscode-extension/e2e',
  timeout: 120000,
  retries: 1,
  fullyParallel: true,
  workers: 8,
  reporter: 'html',
  use: {
    headless: true,
    trace: 'retain-on-failure',  // Only capture trace on failure, not on first retry
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Optimized navigation settings
    navigationTimeout: 30000,
    actionTimeout: 5000,
  },
  projects: [
    {
      name: 'vscode-extension',
      testMatch: /.*\.e2e\.test\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Optimized browser launch options
        launchOptions: {
          args: [
            '--disable-gpu',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
          ],
        },
      },
    },
  ],
});
