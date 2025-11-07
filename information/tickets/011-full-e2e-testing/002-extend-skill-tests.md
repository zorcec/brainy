# Extend E2E Skill Tests: All Scenarios in Desktop Mode

## Context
E2E tests for skills must be comprehensive and run exclusively in VS Code Desktop (Electron) mode. This ensures every skill is validated in all possible user and error scenarios, including those requiring Node.js APIs.

## Goal
Extend and deepen E2E test coverage for all skills, ensuring every possible scenario (success, failure, edge cases, and user flows) is tested in desktop mode.

## Implementation Plan
- For each skill:
	- Identify all possible scenarios: normal operation, error handling, edge cases, and user interactions.
	- Write or extend E2E tests to cover every scenario in desktop mode.
	- Validate skill execution, UI feedback, notifications, and error states.
- Document the workflow for running and maintaining skill E2E tests in desktop mode.

## Edge Cases & Testing
- Ensure all skill scenarios (including rare and error cases) are covered.
- Avoid test duplication; use shared helpers where possible.
- Validate all tests in CI and local desktop environments.

## Risks
- Selector or API differences between skills may require test adjustments.
- Increased maintenance if tests are not well organized or scenarios are missed.

## Outcome
A comprehensive E2E skill test suite that reliably validates all skill scenarios in VS Code Desktop, ensuring robust, user-ready features and error handling.
