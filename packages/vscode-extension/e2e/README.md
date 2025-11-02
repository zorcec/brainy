# E2E Testing Guide

## Overview
The Brainy extension E2E tests use Playwright to control VS Code Web, providing real UI interaction testing. Tests run in parallel with shared VS Code servers for optimal performance.

## Quick Start

### Prerequisites
- Node.js installed
- Dependencies installed: `npm install`
- Extension built: `npm run build` (automatic when running tests)

### Running Tests

```bash
# Run all tests (recommended - exits automatically on completion)
npm run e2e

# Run in headed mode (see browser)
npm run e2e:headed

# Run specific test
npx playwright test --grep "play button appears"

# Run with specific number of workers
npx playwright test --workers=2
```

All commands exit automatically on both success and failure.

## Architecture

### Performance Optimizations
- **Worker-Scoped Servers**: One VS Code server per worker, reused across all tests in that worker
- **Parallel Execution**: 4 workers by default, optimized for 8-core systems
- **Fast Navigation**: Tests navigate to a clean starting page instead of restarting servers
- **Reduced Timeouts**: Optimized wait times throughout test helpers for faster execution

### Test Performance Metrics
- Server startup: ~4s per worker (only once)
- Average test duration: ~5-6s per test
- Total suite execution: ~2 minutes for 23 tests with 4 workers
- Zero flaky tests with current configuration

### Components
1. **VS Code Web Server** - Launched once per worker using `@vscode/test-web`
2. **Playwright Browser** - Controls the browser and interacts with VS Code UI
3. **Test Fixtures** - Worker-scoped fixtures for server reuse and test isolation
4. **Test Suite** - Defines test scenarios and assertions

### Test Flow
```
npm run e2e
  ↓
Build extension (npm run build)
  ↓
Playwright starts with 4 workers
  ↓
Each worker launches one VS Code Web server (@vscode/test-web)
  ↓
Each test navigates to clean starting page (reuses server)
  ↓
Run test scenarios (click, inspect, assert)
  ↓
Capture screenshots/traces on failure
  ↓
Close pages and stop servers after all tests
  ↓
Exit with appropriate exit code (0 for success, non-zero for failure)
```

## Test Fixtures

The test suite uses a modular fixture-based architecture for better maintainability and performance.

### Available Fixtures

Located in `e2e/fixtures/vscode-fixtures.ts`:

#### Worker-Scoped Fixtures (Shared Across Tests)
- **`vscodeServer`**: VS Code Web server instance (one per worker)
  - Starts once per worker
  - Reused across all tests in that worker
  - Automatically cleaned up after all tests complete

#### Test-Scoped Fixtures (Unique Per Test)
- **`vscPage`**: Extended page object with helper methods
  - Creates new page for each test
  - Navigates to clean starting state
  - Provides VS Code-specific helper methods
  - Automatically closed after each test
- **`testStartTime`**: Performance tracking for test duration

### Helper Methods

The `vscPage` fixture provides convenient methods for VS Code interactions:

```typescript
await vscPage.openFile('sample.md');           // Open a file
await vscPage.clickPlayButton();               // Click the play button
const visible = await vscPage.isPlayButtonVisible(); // Check if play button is visible
const logs = await vscPage.captureConsoleLogs(async () => { }); // Capture console logs
const notifications = await vscPage.getNotifications(); // Get notifications
const content = await vscPage.getEditorContent(); // Get editor content
```

For more details, see [FIXTURES.md](./FIXTURES.md).

## Test Scenarios

### Play Button Tests
- ✓ Play button appears on `.brainy.md` files
- ✓ Play button has correct text and icon
- ✓ Play button does NOT appear on regular `.md` files

### Parse and Output Tests
- ✓ Clicking play button parses file and shows output
- ✓ Output is formatted as pretty JSON
- ✓ Success notification appears for valid playbook

### Error Handling Tests
- ✓ Parser errors trigger warning notification
- ✓ Error decorations appear in editor
- ✓ Hovering over error shows tooltip with message

### Integration Tests
- ✓ Can parse same file multiple times
- ✓ Can parse different files sequentially
- ✓ Editor remains functional after parsing

## Test Fixtures

Located in `packages/vscode-extension/e2e/test-project/`:
- `sample-playbook.brainy.md` - Valid playbook for success scenarios
- `playbook-with-errors.brainy.md` - Invalid playbook for error scenarios
- `README.md` - Regular markdown file (no play button)

## Screenshots

Test screenshots are saved to `test-results/`:
- `play-button-visible.png`
- `output-panel.png`
- `success-notification.png`
- `error-notification.png`
- `error-decorations.png`
- `error-tooltip.png`

## Troubleshooting

### Tests are slow or timing out
- **Reduce workers**: Try `npx playwright test --workers=2`
- **Check system resources**: Tests are optimized for 8-core systems with 32GB RAM
- **Run single test**: `npx playwright test --grep "test name"` to isolate issues
- Current configuration: 4 workers, 60s timeout, 0 retries

### VS Code Web doesn't start
- **Port conflict**: Tests use random ports 10000-60000
- **Check dependencies**: Ensure `@vscode/test-web` is installed: `npm install`
- **Rebuild extension**: `npm run build` in the vscode-extension package
- Servers are worker-scoped and reused across tests

### Extension not loaded
- **Verify build**: Check `dist/extension.js` exists
- **Rebuild**: `npm run build` in packages/vscode-extension
- **Check path**: Verify `extensionDevelopmentPath` in `vscode-web-server.ts`
- Extension loads once per worker, not per test

### Selectors not found
- **VS Code Web UI changes**: Update selectors in `helpers/vscode-page-helpers.ts`
- **Run in headed mode**: `npm run e2e:headed` to inspect elements
- **Check CodeLens support**: VS Code Web may have limitations; tests use command palette fallback

### Tests don't exit
- Tests now exit automatically on both success and failure
- If hanging, check for background processes: `ps aux | grep vscode`
- Kill stuck processes: `pkill -f @vscode/test-web`

### Parallel execution issues
- Workers use isolated VS Code servers on different ports
- Each test gets a fresh page navigation to clean state
- No shared state between tests in different workers
- If tests interfere, reduce workers: `--workers=1`

## CI/CD Integration

Tests are optimized for CI environments and exit automatically on completion.

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm install

- name: Install Playwright browsers
  run: npx playwright install chromium

- name: Build extension
  run: npm run build

- name: Run E2E tests
  run: npm run e2e
  
- name: Upload test results on failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

### Performance Tips for CI
- Use `--workers=2` on smaller CI runners
- Tests automatically exit with appropriate exit codes
- Artifacts (traces, screenshots) only captured on failure
- Total execution time: ~2-3 minutes with 4 workers

## Development Workflow

### Running Tests During Development
```bash
# Quick iteration - run one test
npx playwright test --grep "your test name"

# Run subset of tests
npx playwright test --grep "Play Button UI"

# Debug failing test
npx playwright test --debug --grep "failing test"

# Run with fewer workers for stability
npx playwright test --workers=1
```

### Before Committing
```bash
# Run all tests to ensure nothing broke
npm run e2e

# Check exit code
echo $?  # Should be 0 for success
```

## Maintenance

### Updating Tests
1. Modify test scenarios in `playbook.e2e.test.ts`
2. Update helpers if UI interaction patterns change
3. Rebuild extension: `npm run build`
4. Run tests: `npm run e2e`

### Adding New Test Scenarios
1. Add test case to appropriate `test.describe` block
2. Use helpers from `vscode-page-helpers.ts`
3. Add screenshots for visual verification
4. Document new fixtures if needed

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-web](https://github.com/microsoft/vscode-test-web)
- [Test Fixtures Documentation](./FIXTURES.md)
- [Project README](../../../README.md)

## Summary

- **Setup**: Run `npm install`, extension builds automatically with `npm run e2e`
- **Execution**: Tests run in parallel with 4 workers, ~2 minutes for full suite
- **Performance**: Worker-scoped VS Code servers, optimized wait times, zero flaky tests
- **Exit Behavior**: Automatic exit on both success and failure with appropriate exit codes
- **Platform**: Optimized for Linux (primary development environment)
- **Debugging**: Use `--headed`, `--debug`, or `--grep` for targeted testing
