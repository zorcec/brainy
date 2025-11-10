# Brainy Playbook E2E Testing Guide

## Overview
Brainy extension E2E tests use Playwright to automate VS Code Desktop (Electron), enabling real UI interaction and full extension-host access. Tests are organized by feature area and run in parallel for optimal performance. All tests run exclusively in VS Code Desktop mode.

## Quick Start
- Install Node.js
- Run `npm install` to install dependencies
- Build the extension: `npm run build` (automatic with tests)
- VS Code Desktop is downloaded automatically on first run

### Running Tests
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

## Test Structure & Architecture
Tests are split into suites by feature area for maintainability:
- Play button UI functionality
- Playbook parsing and output
- Error handling and decoration
- File type detection and CodeLens activation
- Content structure verification
- Multiple parse operations and sequential file handling
- Skill execution (JavaScript/TypeScript)

All suites use a shared browser context per worker via `vscode-suite-fixtures.ts`, improving performance and resource efficiency. Tests within a suite share state, so order may affect results—best for integration testing.

### Fixtures & Helpers
Fixtures are modular and located in `e2e/fixtures/vscode-desktop-fixtures.ts` and `e2e/fixtures/vscode-suite-fixtures.ts`.
- Worker-scoped: `vscodeServer` (VS Code Desktop instance), `vscodeBrowser` (Playwright browser)
- Test-scoped: `vscPage` (extended page object with VS Code helpers)

Example helper methods:
```typescript
await vscPage.openFile('sample.md');
await vscPage.clickPlayButton();
await vscPage.isPlayButtonVisible();
await vscPage.getEditorContent();
await vscPage.isFileOpen('sample.md');
```
See [FIXTURES.md](./FIXTURES.md) for details.

## Test Files & Artifacts
Test playbooks and files are in `packages/vscode-extension/e2e/test-project/`:
- `sample-playbook.brainy.md` (valid)
- `playbook-with-errors.brainy.md` (invalid)
- `README.md` (regular markdown)

Screenshots and traces are saved to `test-results/` for debugging.

## Troubleshooting
- If tests are slow or timing out, reduce workers: `npx playwright test --workers=2`
- If VS Code Desktop doesn't start, check for port conflicts, dependencies, or clean temp dirs: `rm -rf /tmp/vscode-test-*`
- If extension isn't loaded, verify build and paths
- Trust dialog should be auto-dismissed; helpers will click "Trust" if needed
- If selectors break, run in headed mode and update helpers
- Tests exit automatically; kill stuck processes if needed

## CI/CD Integration
- Tests exit automatically in CI environments
- Example GitHub Actions steps:
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

## Development Workflow
- Run one test: `npx playwright test --grep "your test name"`
- Run subset: `npx playwright test --grep "Play Button UI"`
- Debug: `npx playwright test --debug --grep "failing test"`
- Fewer workers: `npx playwright test --workers=1`
- Before committing: run all tests with `npm run e2e` and check exit code

## Maintenance
- Update or add test scenarios in the relevant suite file
- Update helpers if UI changes
- Rebuild extension and run tests

## Resources
- [Playwright Documentation](https://playwright.dev/)
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension)
- [@vscode/test-electron](https://github.com/microsoft/vscode-test)
- [Test Fixtures Documentation](./FIXTURES.md)
- [Project README](../../../README.md)

## Summary
The E2E suite validates Brainy extension features using VS Code Desktop automation via Playwright. Tests are organized by feature, run in parallel, and use worker-scoped VS Code servers for speed and reliability. Debug and maintain tests using the provided helpers and workflows.
