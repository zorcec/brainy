# Story: Implement parallel test execution with VS Code server reuse

**Status:** Todo

**Context**
- E2E tests currently start multiple VS Code servers, increasing execution time.
- The epic aims for "blazingly fast" test runs and full hardware utilization.
- Parallelization should minimize redundant server startups.

**Goal**
- Enable parallel execution of E2E tests.
- Reuse single VS Code server instances per worker.
- before every test navigate to starting page to simulate same starting point.
- Reduce total test suite execution time.

**Implementation Plan**
- Refactor test runner to support parallel execution. Use Playwright's automatic worker detection, but allow manual tuning (e.g., for 8-core/32GB RAM systems).
- Implement logic to reuse VS Code server per worker.
- For navigation to starting page before each test, check and follow best practices (direct URL, UI interaction, or API call as appropriate).
- Benchmark execution time before and after changes. Document results at the bottom of this story.

**Edge Cases & Testing**
- Validate that server reuse does not cause test interference. If interference is detected, flag for manual review (no automatic retries).
- Test with varying numbers of workers and test cases. Use Playwright's options for worker count.

**Technical Debt & Risks**
- Risk of shared state between tests; mitigate by resetting state between runs.
- Possible issues with server lifecycle management.
- No scenarios currently require disabling server reuse (not needed for debugging or specific test cases).

**References**
- Epic: Improve E2E Tests Setup
- [E2E Testing Guide](../../../../packages/vscode-extension/e2e/README.md)
- [Developing Guideline](../../../developing-guideline.md)

---

**Benchmarking Results**
- Document execution time before and after parallelization and server reuse here for future reference.
