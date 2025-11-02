# Epic: Improve E2E Tests Setup

**Status:** Todo

**Context**
 - Target execution time: Ideally, a few seconds per test case; suite should be considered "blazingly fast" if this is achieved.
 - Current flakiness rate: Not measured, but goal is zero flaky tests; network waiting commands should have low timeouts.
 - Contributor pain points: None expected; setup should only require `npm i`.
 - Parallelization: Tests should utilize full system resources; strategy is to minimize VS Code server startups, reuse existing ones by navigating back to index page, ideally one per worker.
 - Compatibility: Starting an MCP server inside the extension is not required if it causes issues with `@vscode/test-web`.
 - Smoke test: No dedicated smoke test for setup confirmation currently exists.
 - Documentation: Should be up to date, but feel free to rewrite for clarity and troubleshooting.
 - Legacy issues: No specific legacy issues with test organization or caching to prioritize.

**Goal**
 - Zero flaky tests; low network timeouts.
 - Contributors should face no pain points in setup.
 - Tests should run in parallel, maximizing hardware utilization and minimizing redundant VS Code server startups.

**Implementation Plan**
 - Rewrite documentation if needed to ensure clarity and up-to-date troubleshooting.
 - Implement parallelization strategy: reuse VS Code servers, one per worker, navigate back to index page when possible.
 - Set low timeouts for network waiting commands to reduce flakiness.

**Edge Cases & Testing**
 - No dedicated smoke test currently; consider adding if setup confirmation becomes necessary.

**Technical Debt & Risks**
 - Compatibility issues with MCP server startup inside extension are not a blocker.

**References**
 - Ideally, each test case runs in a few seconds, with zero flaky tests and no setup pain points.
 
## Proposed Story Titles
- Rewrite the test setup to use @vscode/test-web
- Implement parallel test execution with VS Code server reuse
- Ensure contributors can run/debug E2E tests with simple commands
- Write documentation
