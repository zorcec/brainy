---
description: 'Guidelines for LLM debugging and effective execution of Playwright tests in the ai-instructions project.'
keywords: ['playwright', 'debugging', 'llm', 'test execution', 'speed', 'efficiency']
taskType: ['testing', 'debugging', 'automation']
applyTo: '**/*.test.ts, **/*.test.js, **/*.spec.ts, **/*.spec.js'
---

# Playwright Test Debugging & Execution Guidelines for LLMs

## Purpose
This instruction file provides best practices for LLMs to debug Playwright tests and run them efficiently in the ai-instructions project.

## Debugging Playwright Tests
- Use Playwright's built-in debug mode: `npx playwright test --debug` to step through failing tests interactively.
- Run tests in headed mode for visual inspection: `npx playwright test --headed`.
- Use `--grep "<test name>"` to run only the relevant test(s) and isolate issues quickly.
- Check Playwright's trace and screenshot artifacts in the `test-results/` or `playwright-report/` directories for error context.
- Review console logs and notifications using Playwright's helper methods or fixtures.
- If selectors break, inspect the UI in headed mode and update selectors in helpers.
- Use Playwright's `expect` assertions for clear error messages and stack traces.

## Speeding Up Test Execution
- Run only the affected suite or test: `npx playwright test <path/to/test-file>` or with `--grep`.
- Use `--ui` mode for interactive test selection and debugging.
- Avoid running all tests unless necessary; focus on changed or failing tests.
- Clean up temporary directories if tests hang: `rm -rf /tmp/vscode-test-*`.
- Use Playwright's parallel execution and worker-scoped fixtures for optimal performance.

## Effective Debugging Workflow
1. Identify failing test(s) using the report or CI output.
2. Run the test in debug or headed mode to reproduce the issue.
3. Inspect UI, logs, and artifacts for clues.
4. Isolate the test using `--grep` or by running the specific file.
5. Update selectors, fixtures, or helpers as needed.
6. Re-run the test to confirm the fix.
7. Commit only after all relevant tests pass.

## References
- [Playwright Debugging Docs](https://playwright.dev/docs/debug)
- [Playwright Test CLI](https://playwright.dev/docs/test-cli)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)

---

This file should be updated as new Playwright features and best practices emerge.
