import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'packages/vscode-extension/e2e',
  timeout: 60000,
  retries: 0,
  use: {
    headless: true,
  },
});
