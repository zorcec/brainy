# Story: Refactor Test Grouping and Fixtures

## Context
E2E tests lack modular grouping and reusable fixtures, making maintenance and scaling difficult. The epic focuses on improving test structure and organization.

## Problem Statement
Tests are organized ad-hoc, with redundant setup and limited fixture reuse. Grouping and modular fixtures will improve maintainability.

## Goals & Objectives
- Group related tests for better organization
- Modularize and reuse fixtures
- Simplify test maintenance and extension

## Scope
- Refactor test files for logical grouping
- Implement shared and modular fixtures
- Document new structure for contributors

## Out of Scope
- Non-E2E test types
- Major changes to test scenarios

## Success Criteria
- Tests are grouped and easy to extend
- Fixtures are reusable and maintainable
- Contributors can easily add new tests

## Stakeholders
- Extension developers
- QA engineers

## Dependencies
- Playwright configuration
- Existing test files and fixtures

## Milestones & Timeline
1. Refactor test files (short term)
2. Implement modular fixtures (short term)
3. Document structure (short term)

## Related Epics & Stories
- Epic: E2E Tests Optimization and Organization Foundation
- Story: Implement shared browser context

## Clarifications & Decisions
<PLACEHOLDER: Confirm grouping strategy and fixture scope>

## References
- [TEST-OPTIMIZATION.md](../../../packages/vscode-extension/TEST-OPTIMIZATION.md)
- [developing-guideline.md](../../../developing-guideline.md)

## Notes

## Code Snippet
```ts
// Before: Redundant setup in each test file
test('feature A', async () => {
	const context = await setupContext();
	// ...test code...
});
test('feature B', async () => {
	const context = await setupContext();
	// ...test code...
});

// After: Shared fixtures and grouped tests
import { test, expect } from '@playwright/test';
test.describe('Feature Group', () => {
	test.use({ context: setupContext() });
	test('feature A', async ({ context }) => {
		// ...test code...
	});
	test('feature B', async ({ context }) => {
		// ...test code...
	});
});
```