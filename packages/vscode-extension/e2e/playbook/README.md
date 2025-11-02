# Playbook E2E Test Suites

This directory contains split E2E test suites for Brainy playbook functionality, organized by feature area.

## Test Structure

The tests have been organized into separate suites for better maintainability and clarity:

- **play-button.test.ts** - Play button UI functionality tests
- **parse-output.test.ts** - Playbook parsing and output tests
- **error-handling.test.ts** - Error handling and decoration tests
- **file-type-detection.test.ts** - File type detection and CodeLens activation tests
- **content-verification.test.ts** - Parsed content structure verification tests
- **multiple-operations.test.ts** - Multiple parse operations and sequential file handling tests
- **skill-execution.test.ts** - Skill execution functionality with JavaScript and TypeScript

## Shared Browser Context

All test suites use a **suite-level shared browser context** via the `vscode-suite-fixtures.ts` fixture. This means:

- Each worker creates **one VS Code page** that is shared across all tests in that suite
- Tests within a suite share the same browser context and page
- This improves test performance by reducing setup/teardown overhead
- Tests are still isolated at the worker level (different workers get different pages)

### Benefits

1. **Faster execution** - No need to create/destroy browser context for each test
2. **Realistic scenarios** - Tests can build on each other's state within a suite
3. **Resource efficiency** - Reduced memory and CPU usage

### Trade-offs

- Tests within a suite are **not fully isolated** from each other
- Test order can affect results if state is not properly managed
- Good for integration testing, less ideal for strict unit testing

## Running Tests

```bash
# Run all e2e tests
npm run e2e

# Run specific suite
npx playwright test packages/vscode-extension/e2e/playbook/play-button.test.ts

# Run with UI mode
npx playwright test --ui

# View last report
npx playwright show-report
```

## Test Results

Current status: ✅ **21 passed, 2 skipped**

The skipped tests are for features not yet fully supported in VS Code Web (error decorations and hover tooltips).
