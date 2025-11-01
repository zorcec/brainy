## Title
Unit and E2E tests for playbook execution

## Problem
There are no tests verifying playbook execution, error propagation, timeout behavior, or output display. Without tests, regressions are likely.

## Solution
Add unit tests for the executor logic and e2e tests that run a playbook in the test-project and assert outputs and error behavior are surfaced to the UI layer (or mocked interface).

## Proposal
- Unit tests for the execute skill (spawned skill process exercised via IPC) covering:
	- Successful console.log output
	- Syntax error handling
	- Runtime exception handling
	- Large-output pass-through (no truncation)
	- Non-JS rejection observed at the parser level
- E2E tests:
	- Run a sample playbook from `packages/vscode-extension/e2e/test-project/` that includes multiple JS blocks and assert the extension spawns the `execute` skill and the runner returns expected structured results.
	- Validate that non-JS blocks are rejected before invoking the skill.
- Use existing test frameworks in the repo (Vitest for unit tests; Playwright-based e2e harness).
- Test placement and style:
	- Unit tests that exercise the real skill process should live in `packages/vscode-extension/e2e/` (they will spawn the skill and use IPC to send `run`/receive `result`). Keep these unit tests small and fast (small scripts, short output).
	- Playwright e2e tests should remain in `packages/vscode-extension/e2e/` and reference fixtures in `e2e/test-project/`.

## Acceptance Criteria
- [ ] Unit tests exist and pass that spawn the `execute` skill process and exercise it via IPC (success, syntax/runtime error, large output, non-JS rejection via parser).
- [ ] E2E Playwright test runs demonstrate playbook execution end-to-end using the test-project fixtures and confirm the extension spawns the skill and relays results to the UI/logs.
- [ ] Tests use small, fast scripts and avoid heavy or long-running workloads to keep CI stable.
- [ ] The test suite asserts that the system supports no enforced timeout and no truncation (i.e., full outputs are delivered), while keeping test payloads reasonable.

## Tasks/Subtasks
- [ ] Add Playwright e2e test in `packages/vscode-extension/e2e/playbook-execution.test.ts` that opens example playbooks from `e2e/test-project/` and asserts execution results.
- [ ] Add example playbook fixtures in `packages/vscode-extension/e2e/test-project/` used by both unit and e2e tests (successful case, error case, non-JS rejection case).
- [ ] Ensure tests are small, fast, and deterministic (avoid large outputs or long-running scripts in CI).

## Open Questions
- Are there CI resource constraints that require different test time budgets? (Tests are designed to be small/fast; confirm if CI needs additional limits or skip flags.)

## Additional Info
- Keep tests deterministic by using small, fast scripts and explicit timeouts.

## References
- Epic: Playbook Execution Engine (../epic.md)
