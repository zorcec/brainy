# Story: Optimize Headless Mode and Startup Flags

## Context
E2E tests use various startup flags and modes, but optimization is needed for speed and reliability. The epic includes headless mode and startup flag improvements.

## Problem Statement
Suboptimal startup flags and headless mode settings slow down tests and may cause flaky behavior. Optimization can improve speed and reliability.

## Goals & Objectives
- Optimize headless mode usage
- Refine startup flags for faster, more reliable tests
- Track timing metrics for performance

## Scope
- Review and update headless mode settings
- Refactor startup flags in Playwright and VS Code server
- Implement timing metrics for test runs

## Out of Scope
- Non-E2E test types
- Major changes to test scenarios

## Success Criteria
- Faster, more reliable test runs
- Startup flags are documented and optimal
- Timing metrics available for analysis

## Stakeholders
- Extension developers
- QA engineers

## Dependencies
- Playwright configuration
- VSCodeWebServer implementation

## Milestones & Timeline
1. Review and update settings (short term)
2. Refactor flags and metrics (short term)
3. Validate improvements (short term)

## Related Epics & Stories
- Epic: E2E Tests Optimization and Organization Foundation
- Story: Refactor test grouping and fixtures

## Clarifications & Decisions
<PLACEHOLDER: Confirm which flags impact reliability most>

## References
- [TEST-OPTIMIZATION.md](../../../packages/vscode-extension/TEST-OPTIMIZATION.md)
- [developing-guideline.md](../../../developing-guideline.md)

## Notes

## Code Snippet
```ts
// Before: Default headless and startup flags
const browser = await playwright.chromium.launch();

// After: Optimized headless mode and custom flags
const browser = await playwright.chromium.launch({
	headless: true,
	args: ['--disable-gpu', '--no-sandbox', '--start-maximized']
});
// Timing metrics example
const start = Date.now();
// ...test code...
const duration = Date.now() - start;
console.log(`Test duration: ${duration}ms`);
```