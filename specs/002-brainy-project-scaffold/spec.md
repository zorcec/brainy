

# Status: Draft

# Spec: Brainy Project Scaffolding and Test Setup

## Related Docs
- See mcp-insight project structure and documentation for reference.
- Example files to reference for scaffolding:
	- [Root package.json](../../../../mcp-insight/package.json)
	- [Root playwright.config.ts](../../../../mcp-insight/playwright.config.ts)
	- [Server package.json](../../../../mcp-insight/packages/mcp/package.json)
	- [Server tsconfig.json](../../../../mcp-insight/packages/mcp/tsconfig.json)
	- [Server entry (src/server.ts)](../../../../mcp-insight/packages/mcp/src/server.ts)
	- [Server test (src/server.test.ts)](../../../../mcp-insight/packages/mcp/src/server.test.ts)
	- [Extension package.json](../../../../mcp-insight/packages/vscode-extension/package.json)
	- [Extension tsconfig.json](../../../../mcp-insight/packages/vscode-extension/tsconfig.json)
	- [Extension vitest.config.ts](../../../../mcp-insight/packages/vscode-extension/vitest.config.ts)
	- [Extension entry (src/extension.ts)](../../../../mcp-insight/packages/vscode-extension/src/extension.ts)
	- [Extension test (src/extension.test.ts)](../../../../mcp-insight/packages/vscode-extension/src/extension.test.ts)
	- [Extension E2E test (e2e/example-ui.e2e.test.js)](../../../../mcp-insight/packages/vscode-extension/e2e/example-ui.e2e.test.js)


## Note on Data Layer
- The server package must include SQLite with vector search support (as in mcp-insight), and the configuration/example code must allow this to work out of the box.

- Root
	- `package.json` (workspaces, scripts for test/build/e2e)
	- `playwright.config.ts` (E2E config)
	- `packages/`
		- `server/` (Brainy server)
			- `package.json`, `tsconfig.json`, `src/`, `dist/`
			- Entry: `src/server.ts` (hello world server)
			- Tests: `src/server.test.ts` (basic endpoint test)
		- `vscode-extension/`
			- `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/`, `e2e/`, `dist/`
			- Entry: `src/extension.ts` (hello world extension)
			- Tests: `src/extension.test.ts` (activate/deactivate)
			- E2E: `e2e/example-ui.e2e.test.js` (launches VS Code, checks extension command)

## Assumptions
- The Brainy project will follow a monorepo structure similar to mcp-insight.
- TypeScript will be used for both server and extension code.
- Vitest and Playwright will be used for unit and end-to-end testing.
- Developers are familiar with Node.js and VS Code extension development.

## Open Questions
- Are there any additional packages or tools (beyond those in mcp-insight) required for Brainy?
- Should the initial scaffold include example tests for both server and extension?

## What
Set up the Brainy project with a monorepo structure, including packages for the server and VS Code extension. Configure TypeScript, Vitest, and Playwright for development and testing. Provide build scripts, example tests, and documentation to ensure the project is ready for local development and CI.

- Node.js and npm
- TypeScript
- Vitest
- Playwright
- VS Code extension API
- SQLite with vector search support (e.g., lancedb, better-sqlite3, or similar as in mcp-insight)

## Who
- Developers and contributors to the Brainy project

## Why
Consistent project structure and robust testing are essential for maintainability, collaboration, and quality. Mirroring mcp-insight ensures best practices and a familiar workflow for contributors.

- [FR-001] The project uses a monorepo structure with separate packages for the server and VS Code extension, matching mcp-insight.
- [FR-002] TypeScript is configured for both packages, with separate `tsconfig.json` files.
- [FR-003] Vitest is set up for unit testing in both packages, with example tests that pass (no business logic).
- [FR-004] Playwright is set up for end-to-end testing of the extension, with a basic UI test that passes.
- [FR-005] Build scripts are provided for both packages and work as expected.
- [FR-006] Each package has a working entry point (`src/server.ts`, `src/extension.ts`) that runs without errors (hello world/activation only).
- [FR-007] Example tests are included for both server and extension, and all tests must execute and pass.
- [FR-008] Playwright E2E test for the extension is included and passes.
- [FR-009] Documentation is provided for setup, build, and test processes.
- [FR-010] The server package includes SQLite with vector search support, and the configuration/example code allows this to work out of the box (mirroring mcp-insight, but without business logic).

## Non-Functional Requirements
- [NFR-001] The project must be easy to set up for new contributors (single command for install/build/test).
- [NFR-002] Tests must run locally and in CI environments.

## Test Cases
- [TC-001] Developer can clone the repo, install dependencies, and build both packages with a single command.
- [TC-002] Running tests executes all unit and end-to-end tests successfully.
- [TC-003] Example tests pass for both server and extension (no business logic).
- [TC-004] Entry points for server and extension run and show expected hello world/activation behavior.
- [TC-005] Playwright E2E test for the extension runs and passes.
- [TC-006] Documentation clearly explains setup and test processes.
