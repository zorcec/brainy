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

**Before Optimization (Initial State):**
- Configuration: 8 workers, 120s timeout, 1 retry
- Issue: Each test started its own VS Code server (~5s startup each)
- Result: Tests frequently timed out or got interrupted with 8 parallel workers
- 23 total tests would theoretically take ~23 * 30s = 11.5 minutes if run sequentially

**After Server Reuse Implementation:**
  - Workbench wait: 4s → 2s
  - File open wait: 4s → 2s
  - CodeLens wait: 3s → 1.5s
  - Click action wait: 5s → 2s
  - Console log capture: 3s → 1.5s
  - Server initialization: 3s → 2s

**Latest Optimization (Selector Removed, 8 Workers):**
- Configuration: 8 workers, 60s timeout, 0 retries
- Change: Removed problematic selector `.monaco-editor.focused` from all helpers
- Result: 21 passed (2 skipped) in **41.4 seconds** total run time
- Performance: Nearly 3x faster than previous best
- Stability: All tests pass, no flaky failures
- Worker utilization: All 8 workers fully utilized

**Summary:**
- Removing unnecessary waits and increasing worker count dramatically improved suite speed.
- E2E suite now completes in under a minute on 8-core hardware.

**Key Metrics:**
- Server startup time per worker: ~4s (only happens once per worker)
- Average test duration: ~5-6s per test (down from ~30s with individual servers)
- Total execution time: 2:07 for 23 tests with 4 workers
- Worker utilization: Efficient - only 3 workers needed for 23 tests

**Hardware Context:**
- System: 8-core CPU, 32GB RAM
- Optimal worker count: 4 (balances speed and stability)
