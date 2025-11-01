
# Epic: E2E Tests Optimization and Organization Foundation

## Context
Current E2E tests for the Brainy VS Code extension use Playwright and VS Code Web servers. Recent improvements enabled parallel execution and random port assignment, but test runs remain slow and organization is ad-hoc. Optimization and better structure are needed for scalability and maintainability.

## Problem Statement
Test suite execution is slow due to isolated server/browser per test and redundant initialization. Test grouping and modular setup are lacking, making future scaling and maintenance difficult.

## Goals & Objectives
- Reduce E2E test run time by 30–50%
- Eliminate port/resource conflicts and flaky startup
- Modularize test setup and fixtures for maintainability
- Lay foundation for scalable test organization
- Parallalize execution better

## Scope
- Shared browser context implementation
- VS Code server pooling and reuse
- Test grouping and fixtures
- Headless mode and startup flag optimization
- Timing metrics and performance tracking

## Out of Scope
- Non-E2E test types (unit, integration)
- Extension feature development unrelated to testing

## Success Criteria
- Test suite runs 2.5–4 minutes faster per suite
- No port or resource conflicts
- Tests are grouped and easy to extend
- Quick wins implemented, server pooling in progress

## Stakeholders
- Extension developers
- QA engineers
- Product owners

## Dependencies
- Playwright configuration
- VSCodeWebServer implementation
- Extension activation reliability

## Milestones & Timeline
1. Quick wins: shared browser context, headless optimization, startup flags (short term)
2. Server pooling, test grouping & fixtures (medium term)
3. Mock/stub operations, selective execution strategy (long term)

## Related Stories
- Implement shared browser context
- Add VS Code server pooling
- Refactor test grouping and fixtures
- Optimize headless mode and startup flags
- Add timing metrics and performance tracking

## Notes
See TEST-OPTIMIZATION.md for detailed recommendations, priorities, and debugging tips. Review and iterate sections as needed before finalizing.
