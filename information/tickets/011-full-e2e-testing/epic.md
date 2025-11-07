
# Enable Full E2E Testing for Skills in VS Code Extension

## Blogline (Short Abstract)
Enable Playwright-driven E2E tests for skills and extension-host features by supporting VS Code Desktop automation only, ensuring full coverage of Node.js APIs and extension workflows. Web-based E2E testing is no longer supported.

## Audience & Stakeholders
- Product Architect
- QA/Testing Team
- Extension Developers
- Users relying on advanced skills in the extension

## WHY
Current E2E tests previously used Playwright with the VS Code web server, which could not access Node.js APIs. This limited test coverage and prevented true E2E validation of skills and extension-host features. All E2E tests will now use Playwright to automate VS Code Desktop (Electron) only:
- Allow testing of all extension features, including those requiring Node.js APIs
- Improve reliability and confidence in releases
- Remove the need to support web mode; only desktop mode is supported and maintained

## Functional Requirements
- Playwright E2E tests must be able to automate VS Code Desktop (Electron)
- All existing skills must be tested E2E (full coverage of skill execution and validation)
- Skills and extension-host features must be testable E2E
- Remove all web-based E2E test support; only desktop mode is required
- Provide scripts and documentation for desktop mode only
## Example: Playwright Code Change for VS Code Desktop Automation

```ts
import { chromium, Browser, Page } from 'playwright';

let browser: Browser;
let page: Page;

beforeAll(async () => {
	// Launch VS Code Desktop with --remote-debugging-port=9222 externally
	browser = await chromium.connectOverCDP('http://localhost:9222');
	const context = browser.contexts()[0];
	page = context.pages()[0];
});

it('should execute all registered skills E2E', async () => {
	// Example: Trigger a skill via the command palette or UI
	await page.keyboard.press('Control+Shift+P');
	await page.type('.monaco-inputbox input', 'Run Skill:');
	// Add logic to select and execute each skill, then validate output
	// ...
});

afterAll(async () => {
	await browser.close();
});
```

*This example demonstrates connecting Playwright to a running VS Code Desktop instance and outlines how to trigger and validate skills E2E. Actual selectors and skill invocation logic should be adapted to your extension's UI and skill registration.*

## Non-Functional Requirements
- Tests must be fast—aim for minimal execution time per skill and overall suite
- Test setup and execution should be simple and easy to maintain
- Challenge and optimize test speed and setup wherever possible, but always prefer simplicity over unnecessary complexity
- Tests must be reliable and repeatable
- Test setup should be maintainable and well-documented
- Security: No exposure of sensitive data during test runs
- The test workspace must be a single source of truth, but for each test run it should be copied to a temporary location to ensure the original is never modified by tests
Organize E2E tests in a single desktop-specific directory (e.g., `e2e/desktop/`). All tests should target desktop mode only. Remove any web-specific test directories or scripts. The `npm run e2e` command should execute only desktop E2E test suites.
*All new and existing tests should be reviewed and optimized for speed and simplicity. If a test or setup is slow, challenge the approach and seek improvements, but avoid introducing unnecessary complexity.*

## Success & Completion
This epic is complete when:
- Playwright E2E tests can drive VS Code Desktop and access Node.js APIs
- Skills and extension-host features are covered by E2E tests
- All existing tests are migrated to desktop mode and continue to work without regression
- Documentation is updated for the new desktop-only workflow
- All acceptance criteria are met and validated in CI

## Stories
- Enable Playwright automation for VS Code Desktop
- Update E2E test runner for desktop mode only
- Add E2E tests for all skills and extension-host features (desktop mode only, move all existing skill web tests to desktop if there are any)
- Document E2E workflow for desktop mode only

## Dependencies
- Playwright support for Electron/Chromium automation
- Access to VS Code Desktop builds in CI
- Existing E2E test infrastructure

## Out of Scope
- Refactoring unrelated test logic
- Browser compatibility issues and web-based E2E testing

## Risks, Edge Cases & Open Questions
- Electron/Chromium version mismatches may cause instability
- CI environments may require additional setup for VS Code Desktop
- Selector differences between previous web and new desktop mode may require test adjustments
- Open: How to best parameterize test runner for desktop mode?

### Clarifications & Decisions
- All skills and extension-host features should be testable via UI or command palette; if not, acknowledge as a blind spot and prefer writing testable skills.
- No known Playwright/Electron/Chromium issues in CI; main challenge is migration from web to desktop mode. Scan codebase for web workarounds (e.g., try/catch imports) and clean them up.
- E2E test runner must execute skills sequentially for simplicity and to avoid business logic changes.
- Utility should copy the test workspace for each test, use it, and clean up after. Keep the approach simple.
- No strict performance targets, but always challenge to simplify and keep test duration low.
- Temporary test workspace must be cleaned up after each run.
- Place temporary workspace copies inside the source-code directory for easier inspection, following best practices.

## References
- [Playwright + Electron documentation](https://playwright.dev/docs/api/class-electron)
- [VS Code Extension Tester](https://github.com/redhat-developer/vscode-extension-tester)
- [VS Code Test Runner](https://github.com/microsoft/vscode-test)
- Workspace: `information/preparation/vscode-extension-e2e-testing.md`
