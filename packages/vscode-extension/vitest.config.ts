import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/e2e/**', '**/node_modules/**'],
    coverage: {
      reporter: ['text', 'json']
    }
  }
});
