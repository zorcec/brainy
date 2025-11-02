# Story: Write and document simple E2E test commands

**Status:** Todo

**Context**
- The E2E test setup and usage should be clearly documented for contributors.
- Contributors should be able to run and debug E2E tests easily after installing dependencies.
- The epic emphasizes up-to-date, clear troubleshooting and setup instructions.
- Playwright and @vscode/test-web are used for E2E testing.
- The epic targets zero pain points in setup and usage.

**Goal**
- Provide comprehensive documentation for E2E test setup, execution, and troubleshooting.
- Ensure documentation is easy to follow and up to date.
- Provide simple, documented commands for running and debugging E2E tests.
- Ensure setup requires only `npm i` and no manual configuration.
- Make debugging straightforward for contributors.
- When `npm run e2e` script is run, once the tests are executed it should always exit fully (on failure and success)

**Implementation Plan**
- Review and update existing E2E test documentation (reuse existing README files, do not add new ones).
- Add sections for setup, running, debugging, and troubleshooting (focus on general E2E setup problems, not Playwright/@vscode/test-web integration specifics).
- Document all E2E test commands in existing README files; adapt existing npm scripts as needed, do not add new scripts.
- Validate that contributors can run tests without extra steps.
- Add troubleshooting section for common general issues.
- Include examples and screenshots focused on Linux only.
- Validate documentation with a clean setup walkthrough.

**Edge Cases & Testing**
- Ensure documentation covers common general issues and Linux platform details.
- Test setup on clean clone with only `npm i`.
- Validate commands and examples on Linux only.
- Ensure contributors can debug tests in headed mode.
- Validate instructions by following them on a clean clone.

**Technical Debt & Risks**
- Risk of outdated documentation; updates should be made on the fly when needed.
- Possible gaps in troubleshooting coverage.
- Risk of undocumented edge cases; mitigate by updating docs as needed.
- Possible platform-specific issues.

**References**
- Epic: Improve E2E Tests Setup
- [E2E Testing Guide](../../../../packages/vscode-extension/e2e/README.md)
- [Developing Guideline](../../../developing-guideline.md)
