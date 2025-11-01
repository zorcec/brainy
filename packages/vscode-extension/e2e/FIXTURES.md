# E2E Test Fixtures and Structure

## Overview

The E2E tests for Brainy use a modular fixture-based architecture that improves maintainability, reduces code duplication, and provides a consistent testing experience.

## Fixture Architecture

### Core Fixtures

The test suite uses Playwright's fixture system to provide reusable, composable test setup and teardown. All fixtures are defined in `e2e/fixtures/vscode-fixtures.ts`.

#### Available Fixtures

1. **`testStartTime`**: Tracks test execution time for performance metrics
2. **`vscodeServer`**: Automatically starts and stops a VS Code Web server for each test
3. **`vscodeContext`**: Provides an isolated browser context for each test
4. **`vscPage`**: Extended page object with helper methods for VS Code interactions

### VSCodePage Interface

The `vscPage` fixture provides a convenient wrapper around the Playwright `Page` object with VS Code-specific helper methods:

```typescript
interface VSCodePage {
  page: Page;                                    // Raw Playwright page
  openFile: (filename: string) => Promise<void>; // Open a file in the editor
  isPlayButtonVisible: () => Promise<boolean>;   // Check if play button is visible
  clickPlayButton: () => Promise<void>;          // Click the play button
  captureConsoleLogs: (action: () => Promise<void>) => Promise<string[]>; // Capture console logs
  getNotifications: () => Promise<string[]>;     // Get notification messages
  isFileOpen: (filename: string) => Promise<boolean>; // Check if file is open
  getEditorContent: () => Promise<string>;       // Get editor content
  hasErrorDecorations: () => Promise<boolean>;   // Check for error decorations
  getHoverTooltip: (lineNumber: number) => Promise<string>; // Get hover tooltip
  hasCodeLensDecorations: () => Promise<boolean>; // Check for CodeLens decorations
}
```

## Test Structure

### Test Groups

Tests are organized using `test.describe()` blocks for logical grouping:

- **Play Button UI**: Tests for play button visibility and appearance
- **Parse and Output**: Tests for parsing functionality and output validation
- **Error Handling and Decorations**: Tests for error scenarios and UI decorations
- **File Type Detection**: Tests for file type-specific behavior
- **Content Verification**: Tests for parsed content validation
- **Multiple Parse Operations**: Tests for repeated parsing operations
- **UI Integration**: Tests for overall UI integration and functionality

### Writing New Tests

To write a new test using the fixtures:

```typescript
import { test, expect } from './fixtures/vscode-fixtures';

test.describe('My Feature', () => {
  test('should do something', async ({ vscPage }) => {
    // Open a file
    await vscPage.openFile('sample-playbook.brainy.md');
    
    // Interact with the UI
    await vscPage.clickPlayButton();
    
    // Verify behavior
    const notifications = await vscPage.getNotifications();
    expect(notifications).toContain('Success');
  });
});
```

## Benefits of Fixture-Based Architecture

### 1. Reduced Code Duplication

**Before:**
```typescript
test('my test', async () => {
  // Every test had to set up the server, context, and page
  const server = new VSCodeWebServer();
  await server.start();
  const context = await browser.newContext();
  const page = await context.newPage();
  // ... test code ...
  await page.close();
  await context.close();
  await server.stop();
});
```

**After:**
```typescript
test('my test', async ({ vscPage }) => {
  // Setup and teardown handled automatically
  await vscPage.openFile('file.md');
  // ... test code ...
});
```

### 2. Improved Maintainability

- Helper methods are centralized in the fixture
- Changes to setup/teardown logic are made in one place
- Test code focuses on behavior, not infrastructure

### 3. Better Isolation

- Each test gets its own VS Code server instance
- Browser contexts are isolated between tests
- Tests can run in parallel without interference

### 4. Performance Metrics

- Fixtures automatically track setup time and total duration
- Performance data is logged for analysis
- Easy to identify slow tests

## Parallel Execution

Tests run in parallel using multiple workers (configured in `playwright.config.ts`). Each worker:

1. Gets a shared browser instance
2. Creates a new browser context for each test (lightweight)
3. Starts a new VS Code server on a random available port
4. Cleans up after each test automatically

## Migration Guide

If you have existing tests that don't use fixtures, migrate them as follows:

### 1. Update Imports

```typescript
// Before
import { test, expect, Page } from '@playwright/test';
import * as helpers from './helpers/vscode-page-helpers';

// After
import { test, expect } from './fixtures/vscode-fixtures';
```

### 2. Remove Setup/Teardown

```typescript
// Before
test.beforeEach(async () => {
  server = new VSCodeWebServer();
  await server.start();
  // ... more setup ...
});

test.afterEach(async () => {
  await server.stop();
  // ... more teardown ...
});

// After
// No beforeEach/afterEach needed!
```

### 3. Update Test Signatures

```typescript
// Before
test('my test', async () => {
  await helpers.openFile(page, 'file.md');
});

// After
test('my test', async ({ vscPage }) => {
  await vscPage.openFile('file.md');
});
```

### 4. Update Helper Calls

```typescript
// Before
await helpers.clickPlayButton(page);
const notifications = await helpers.getNotifications(page);

// After
await vscPage.clickPlayButton();
const notifications = await vscPage.getNotifications();
```

## Troubleshooting

### Test Timeout

If tests timeout, check:
- VS Code server startup time (logged in console)
- Network connectivity to localhost
- Available ports (tests use random ports 10000-60000)

### Fixture Errors

If fixtures fail to initialize:
- Check that `vscode-web-server.ts` is working correctly
- Verify all helper functions exist in `vscode-page-helpers.ts`
- Review fixture dependencies (order matters)

### Parallel Test Failures

If tests fail only when run in parallel:
- Ensure tests don't share state
- Check for port conflicts (should be automatically handled)
- Verify server cleanup is working properly

## Best Practices

1. **Use fixtures for all tests**: Don't create manual setup/teardown
2. **Keep tests focused**: Test one behavior per test
3. **Use descriptive test names**: Make failures easy to understand
4. **Group related tests**: Use `test.describe()` for organization
5. **Avoid test interdependencies**: Each test should be independent
6. **Clean up resources**: Let fixtures handle cleanup automatically
7. **Log performance data**: Use the built-in metrics for optimization

## References

- [Playwright Fixtures Documentation](https://playwright.dev/docs/test-fixtures)
- [VS Code Test Web](https://www.npmjs.com/package/@vscode/test-web)
- [Brainy Project Overview](../../../project-overview.md)
- [Developing Guidelines](../../../developing-guideline.md)
