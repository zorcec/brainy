# Skills E2E Tests

**Unit tests are recommended for testing skill logic.**

- Skills should be tested with unit tests in Node.js, as this environment supports all required APIs and provides reliable results.
- E2E tests for skills must be designed to work in the web view (browser-based VS Code). Node.js APIs are not available in this environment, so skill execution should be mocked or proxied if needed.
- Focus E2E tests on UI feedback, integration, and workflow, not on direct skill logic execution.

For more details, see the epic documentation in `information/tickets/008-skills-system-expansion/epic.md`.
