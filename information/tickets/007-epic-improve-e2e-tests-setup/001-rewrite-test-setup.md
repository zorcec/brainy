# Story: Rewrite the test setup to use @vscode/test-web

**Status:** Todo

**Context**
- The current E2E test setup does not use @vscode/test-web, which is recommended for VS Code extension testing.
- The goal is to improve reliability and compatibility with VS Code Web.
- The epic targets zero flaky tests and fast execution.
- Playwright is used for browser automation.
- Tests should be easy to run after `npm i`.

**Goal**
- Migrate E2E test setup to use @vscode/test-web.
- Ensure tests run reliably and quickly in VS Code Web.
- Reduce flakiness and improve developer experience.

**Implementation Plan**
- Refactor test setup scripts to launch VS Code Web using @vscode/test-web.
- Update Playwright helpers to interact with VS Code Web.
- Remove legacy test setup code completely (no fallback kept).
- Ensure all existing test cases are covered: either old tests work or are rewritten as needed.
- Focus on making one test work first, then ensure all tests are passing before completion.

**Edge Cases & Testing**
- Confirm tests work in both headless and headed modes.
- Validate on Linux only (no support for other platforms).
- Focus regression validation on one test initially; at the end, ensure all tests are passing.

**Technical Debt & Risks**
- Possible compatibility issues with Playwright selectors after migration (no specific issues known).
- Risk of breaking existing test cases; mitigate by focusing on one test first, then all.

**References**
- Epic: Improve E2E Tests Setup
- [E2E Testing Guide](../../../../packages/vscode-extension/e2e/README.md)
- [Developing Guideline](../../../developing-guideline.md)
- Documentation and npm script updates are covered in a separate story.
