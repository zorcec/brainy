# Enable Playwright automation for VS Code Desktop

## Context
Current E2E tests previously used the VS Code web server, which could not access Node.js APIs. This limited test coverage and prevented full validation of extension-host features and skills. All E2E tests will now use Playwright as the E2E test framework to automate VS Code Desktop (Electron) for true, full-featured E2E testing. Web-based E2E testing is no longer supported; all tests are executed in desktop mode only.

## Goal
Allow Playwright-driven E2E tests to automate VS Code Desktop, enabling coverage of all extension features, including those requiring Node.js APIs. All E2E tests must run in desktop mode, and Playwright remains the E2E test framework.

## Implementation Plan
- Integrate Playwright with VS Code Desktop using Electron/Chromium automation as the E2E test framework.
- Provide scripts to launch VS Code Desktop with the required debugging ports.
- Update test setup to connect Playwright to the running desktop instance.
- Move all existing E2E tests to desktop mode, ensuring all skills and extension-host features are covered. Remove any web-specific test logic or scripts.
- Validate that skills and extension-host features can be triggered and verified via Playwright in desktop mode.

## Edge Cases & Testing
- Ensure Playwright can connect to different VS Code Desktop versions.
- Test on CI and local environments (desktop mode only).
- Handle Electron/Chromium version mismatches.

## Risks
- Instability due to Electron/Chromium version mismatches.
- CI setup may require additional configuration.

## Outcome
Playwright E2E tests can drive VS Code Desktop, enabling full coverage of extension features and skills.

## Clarifications & Additional Requirements
- CI should launch VS Code Desktop in headless mode, using the latest stable version. Tests must also be runnable in desktop mode for debugging failures. WSL compatibility is required.
- Only the latest stable VS Code Desktop version needs to be supported.
- No special security or data isolation requirements for test workspaces.
- Scripts must handle cleanup of all temporary files and processes after tests.
- Tests should execute in parallel to utilize multi-core CPUs (e.g., 8 cores / 16 threads).
- No special reporting or logging requirements for desktop mode failures.
- All E2E tests and infrastructure must only support desktop mode; web mode is deprecated and not maintained.


## Key Implementation Snippets & Changes

- **Launching Multiple VS Code Desktop Instances with Playwright (Parallel Workers):**
```typescript
import { chromium, Browser, Page } from 'playwright';
import { spawn } from 'child_process';

// Utility to find a random available port
async function findRandomAvailablePort(): Promise<number> { /* ... */ }

let browser: Browser;
let page: Page;
let vscodeProcess: any;
let port: number;

beforeAll(async () => {
  port = await findRandomAvailablePort();
  // Launch VS Code Desktop with a unique debugging port per worker
  vscodeProcess = spawn('code', [
    '--remote-debugging-port=' + port,
    '--user-data-dir', `/tmp/vscode-test-${port}`,
    // Add any other flags needed for headless/CI
  ]);

  // Wait for VS Code to be ready (implement a wait-for-port helper)
  await waitForPort(port);

  browser = await chromium.connectOverCDP(`http://localhost:${port}`);
  const context = browser.contexts()[0];
  page = context.pages()[0];
});

afterAll(async () => {
  await browser.close();
  vscodeProcess.kill();
  // Clean up /tmp/vscode-test-${port} if needed
});
```
This approach ensures each Playwright worker gets its own VS Code Desktop instance on a random port. All E2E tests must use this desktop setup; web-based E2E is not supported.

- **Parallel Execution:**
  - Launch multiple VS Code Desktop instances, each on a unique debugging port.
  - Assign ports dynamically for each Playwright worker.
  - All E2E tests are executed in desktop mode only.

- **Test Runner Script Example:**
  ```json
  "scripts": {
    "e2e": "node ./scripts/launch-vscode-desktop.js && npx playwright test --project=desktop"
  }
  ```

- **Cleanup:**
  - Ensure all Electron processes and temp folders are cleaned up after tests.

- **CI Integration:**
  - Install VS Code Desktop, launch in headless mode, and run Playwright tests against it. All tests are run in desktop mode; web mode is not supported.

## References
- [Playwright Documentation](https://playwright.dev/)
- [Playwright: Connect to running browser over CDP](https://playwright.dev/docs/api/class-chromium#chromium-connect-over-cdp)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-web](https://github.com/microsoft/vscode-test-web)
- [VS Code Test Runner](https://github.com/microsoft/vscode-test)
- [VS Code Extension Tester (Electron)](https://github.com/redhat-developer/vscode-extension-tester)
- [GitHub Actions: Playwright](https://playwright.dev/docs/ci)
- [Example: Playwright + Electron](https://playwright.dev/docs/api/class-electron)