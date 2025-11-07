# E2E Testing Guide

## Overview
The Brainy extension E2E tests use Playwright to control VS Code Desktop (Electron), providing real UI interaction testing with full access to Node.js APIs and extension-host features. Tests run in parallel with multiple VS Code Desktop instances for optimal performance.

**Note:** Web-based E2E testing is no longer supported. All tests run exclusively in VS Code Desktop mode.

## Quick Start

### Prerequisites
- Node.js installed
- Dependencies installed: `npm install`
- Extension built: `npm run build` (automatic when running tests)
- VS Code Desktop will be automatically downloaded on first run

### Running Tests

```bash
# Run all tests (recommended - exits automatically on completion)
npm run e2e

# Run in headed mode (see VS Code Desktop windows)
npm run e2e:headed

# Run specific test
npx playwright test --grep "play button appears"

# Run with specific number of workers
npx playwright test --workers=2
```

All commands exit automatically on both success and failure.

## Architecture

### Performance Optimizations
- **Worker-Scoped Servers**: One VS Code Desktop instance per worker, reused across all tests in that worker
- **Parallel Execution**: 4-8 workers by default, optimized for multi-core systems
- **Fast Test Execution**: Tests reuse VS Code instances instead of restarting for each test
- **Reduced Timeouts**: Optimized wait times throughout test helpers for faster execution

### Test Performance Metrics
- Server startup: ~4-5s per worker (only once)
- Average test duration: ~5-8s per test
- Total suite execution: ~3 minutes for 60+ tests with 4 workers
- Zero flaky tests with current configuration

### Components
1. **VS Code Desktop Server** - Launched once per worker using `@vscode/test-electron`
2. **Playwright Browser** - Connects to VS Code via Chrome DevTools Protocol (CDP)
3. **Test Fixtures** - Worker-scoped fixtures for server reuse and test isolation
4. **Test Suite** - Defines test scenarios and assertions

### Test Flow
```
npm run e2e
  ↓
Build extension (npm run build)
  ↓
Playwright starts with 4-8 workers
  ↓
Each worker launches one VS Code Desktop instance with remote debugging
  ↓
Playwright connects to VS Code via CDP (http://localhost:<port>)
  ↓
Each test reuses the same VS Code instance (clean state per test)
  ↓
Run test scenarios (click, inspect, assert)
  ↓
Capture screenshots/traces on failure
  ↓
Close connections and stop VS Code instances after all tests
  ↓
Clean up temporary directories
  ↓
Exit with appropriate exit code (0 for success, non-zero for failure)
```

## Test Fixtures

The test suite uses a modular fixture-based architecture for better maintainability and performance.

### Available Fixtures

Located in `e2e/fixtures/vscode-desktop-fixtures.ts` and `e2e/fixtures/vscode-suite-fixtures.ts`:

#### Worker-Scoped Fixtures (Shared Across Tests)
- **`vscodeServer`**: VS Code Desktop server instance (one per worker)
  - Starts once per worker
  - Reused across all tests in that worker
  - Automatically cleaned up after all tests complete
  - Uses `@vscode/test-electron` to download and launch VS Code Desktop
  
- **`vscodeBrowser`**: Playwright browser connected to VS Code via CDP (one per worker)
  - Connects to VS Code Desktop's remote debugging port
  - Shared across all tests in the worker
  - Automatically closed after all tests complete

#### Test-Scoped Fixtures (Unique Per Test)
- **`vscPage`**: Extended page object with helper methods
  - Reuses the browser connection from worker
  - Provides VS Code-specific helper methods
  - Test isolation through page state management

### Helper Methods

The `vscPage` fixture provides convenient methods for VS Code interactions:

```typescript
await vscPage.openFile('sample.md');           // Open a file
await vscPage.clickPlayButton();               // Click the play button
await vscPage.isPlayButtonVisible();           // Check if play button is visible
await vscPage.getEditorContent();              // Get editor content
await vscPage.isFileOpen('sample.md');         // Check if file is open
```
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
- **Check system resources**: Tests are optimized for multi-core systems
- **Run single test**: `npx playwright test --grep "test name"` to isolate issues
- Current configuration: 4-8 workers, 60s timeout, 1 retry on failure

### VS Code Desktop doesn't start
- **Port conflict**: Tests use random ports 10000-60000
- **Check dependencies**: Ensure `@vscode/test-electron` is installed: `npm install`
- **Rebuild extension**: `npm run build` in the vscode-extension package
- **Clean temp dirs**: `rm -rf /tmp/vscode-test-*`
- VS Code Desktop instances are worker-scoped and reused across tests

### Extension not loaded
- **Verify build**: Check `dist/extension.js` exists
- **Rebuild**: `npm run build` in packages/vscode-extension
- **Check path**: Verify `extensionDevelopmentPath` in `vscode-desktop-server.ts`
- Extension loads once per worker, not per test

### Trust Dialog Appearing
- Should be automatically dismissed with `--disable-workspace-trust` flag
- If it persists, helper functions will click "Trust" button automatically
- Check that flag is present in `vscode-desktop-server.ts`

### Selectors not found
- **VS Code Desktop UI differences**: Desktop may have chat panels and other UI elements not present in web
- **Use specific selectors**: Target main editor with `.monaco-editor[data-uri*="filename"]`
- **Run in headed mode**: `npm run e2e:headed` to inspect elements
- **Check helpers**: Update selectors in `helpers/vscode-page-helpers.ts`

### Tests don't exit
- Tests now exit automatically on both success and failure
- If hanging, check for background processes: `ps aux | grep "code.*remote-debugging-port"`
- Kill stuck processes: `pkill -f "code.*remote-debugging-port"`
- Clean up temp dirs: `rm -rf /tmp/vscode-test-*`

### Parallel execution issues
- Workers use isolated VS Code Desktop instances on different ports
- Each worker maintains a persistent connection via CDP
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
- [Playwright: Connect to running browser over CDP](https://playwright.dev/docs/api/class-chromium#chromium-connect-over-cdp)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-electron](https://github.com/microsoft/vscode-test)
- [Test Fixtures Documentation](./FIXTURES.md)
- [Project README](../../../README.md)

## Summary

The E2E test suite validates the Brainy extension using VS Code Desktop (Electron) automation via Playwright. Tests run in parallel with isolated VS Code instances, providing comprehensive coverage of extension features including playbook execution, CodeLens, error handling, and skills integration. The setup uses Chrome DevTools Protocol (CDP) to connect Playwright to VS Code Desktop, enabling full access to Node.js APIs and extension-host features.

- **Setup**: Run `npm install`, extension builds automatically with `npm run e2e`
- **Execution**: Tests run in parallel with 4 workers, ~2 minutes for full suite
- **Performance**: Worker-scoped VS Code servers, optimized wait times, zero flaky tests
- **Exit Behavior**: Automatic exit on both success and failure with appropriate exit codes
- **Platform**: Optimized for Linux (primary development environment)
- **Debugging**: Use `--headed`, `--debug`, or `--grep` for targeted testing
