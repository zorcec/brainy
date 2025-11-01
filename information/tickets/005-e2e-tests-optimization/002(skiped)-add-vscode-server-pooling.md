# Story: Add VS Code Server Pooling

## Context
E2E tests currently start a new VS Code server for each test, leading to slow execution and port/resource conflicts. The epic targets pooling and reuse for efficiency.

## Problem Statement
Redundant server initialization slows down tests and causes resource conflicts. Pooling can optimize startup and resource usage.

## Goals & Objectives
- Implement VS Code server pooling and reuse
- Eliminate port/resource conflicts
- Reduce test run time

## Scope
- Design pooling mechanism for VS Code servers
- Refactor tests to use pooled servers
- Track and manage server lifecycle

## Out of Scope
- Non-E2E test types
- Major changes to server implementation

## Success Criteria
- No port/resource conflicts
- Faster test execution
- Pooling mechanism is maintainable

## Stakeholders
- Extension developers
- QA engineers

## Dependencies
- VSCodeWebServer implementation
- Playwright configuration

## Milestones & Timeline
1. Design pooling mechanism (short term)
2. Refactor tests (short term)
3. Validate reliability (short term)

## Related Epics & Stories
- Epic: E2E Tests Optimization and Organization Foundation
- Story: Implement shared browser context

## Clarifications & Decisions
<PLACEHOLDER: Confirm pooling limits and teardown strategy>

## References
- [TEST-OPTIMIZATION.md](../../../packages/vscode-extension/TEST-OPTIMIZATION.md)
- [developing-guideline.md](../../../developing-guideline.md)

## Notes

## Code Snippet
```ts
// Before: Each test starts a new VS Code server
test('example', async () => {
	const server = await startVSCodeServer();
	// ...test code...
	await server.stop();
});

// After: Pool and reuse VS Code server instances
let serverPool: VSCodeServerPool;
test.beforeAll(async () => {
	serverPool = new VSCodeServerPool();
	await serverPool.init();
});
test.afterAll(async () => {
	await serverPool.cleanup();
});
test('example', async () => {
	const server = await serverPool.acquire();
	// ...test code...
	serverPool.release(server);
});
```