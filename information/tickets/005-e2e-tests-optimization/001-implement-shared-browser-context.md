# Story: Implement Shared Browser Context

## Context
Current E2E tests use separate browser contexts for each test, causing slow execution and redundant resource usage. The epic aims to optimize test speed and organization.

## Problem Statement
Test runs are slow due to isolated browser contexts. Shared context could reduce startup time and resource consumption.

## Goals & Objectives
- Implement shared browser context for E2E tests
- Reduce test run time and resource usage
- Maintain test isolation and reliability

## Scope
- Update Playwright configuration to support shared context
- Refactor tests to use shared context where possible
- Ensure compatibility with existing fixtures

## Out of Scope
- Non-E2E test types
- Major changes to test scenarios

## Success Criteria
- Test suite runs faster with shared context
- No test failures due to context sharing
- Easy to extend for future tests

## Stakeholders
- Extension developers
- QA engineers

## Dependencies
- Playwright configuration
- Existing test fixtures

## Milestones & Timeline
1. Update Playwright config (short term)
2. Refactor tests (short term)
3. Validate reliability (short term)

## Related Epics & Stories
- Epic: E2E Tests Optimization and Organization Foundation
- Story: Add VS Code server pooling

## Clarifications & Decisions
<PLACEHOLDER: Confirm which tests must remain fully isolated>

## References
- [TEST-OPTIMIZATION.md](../../../packages/vscode-extension/TEST-OPTIMIZATION.md)
- [developing-guideline.md](../../../developing-guideline.md)

## Notes

## Code Snippet
```ts
// Before: Each test creates its own browser context
test('example', async () => {
	const context = await browser.newContext();
	// ...test code...
	await context.close();
});

// After: Shared browser context for all tests in a suite
let sharedContext: BrowserContext;
test.beforeAll(async () => {
	sharedContext = await browser.newContext();
});
test.afterAll(async () => {
	await sharedContext.close();
});
test('example', async () => {
	// ...test code using sharedContext...
});
```