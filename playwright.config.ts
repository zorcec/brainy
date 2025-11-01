import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'packages/vscode-extension/e2e',
  timeout: 120000,
  retries: 1,
  fullyParallel: true,
  workers: 4,
  reporter: 'html',
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'vscode-extension',
      testMatch: /.*\.e2e\.test\.ts/,
    },
  ],
});
