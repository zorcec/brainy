# Brainy Project Scaffolding and Test Setup — Tasks

## Phase 1: Setup
- [X] T001 Create monorepo project structure in root, packages/server, packages/vscode-extension
- [X] T002 Create root package.json and configure workspaces for server and extension
- [X] T003 Create root playwright.config.ts for E2E tests
- [X] T004 Create README.md with setup, build, and test instructions

## Phase 2: Foundational
- [X] T005 Create .gitignore, .npmignore, .eslintignore, .prettierignore in root and packages as needed
- [X] T006 Install and configure TypeScript in both packages (tsconfig.json)
- [X] T007 Install and configure Vitest in both packages
- [X] T008 Install and configure Playwright for extension E2E tests
- [X] T009 Install SQLite with vector search support in server package

## Phase 3: User Story 1 — Monorepo, Build, and Test (P1)
- [X] T010 [P] [US1] Create server package.json, tsconfig.json, and scripts in packages/server
- [X] T011 [P] [US1] Create server entry point src/server.ts (hello world)
- [X] T012 [P] [US1] Create server test src/server.test.ts (unit test for hello world endpoint)
- [X] T013 [P] [US1] Create extension package.json, tsconfig.json, vitest.config.ts, and scripts in packages/vscode-extension
- [X] T014 [P] [US1] Create extension entry point src/extension.ts (hello world activation)
- [X] T015 [P] [US1] Create extension test src/extension.test.ts (unit test for activation)
- [X] T016 [P] [US1] Create extension E2E test e2e/example-ui.e2e.test.js (checks command availability)

## Final Phase: Polish & Cross-Cutting Concerns
- [X] T018 Add example markdown files for knowledge base in server package
- [X] T019 Add comments and documentation to all example files
- [X] T020 Validate that all scripts (build, test, e2e) work as expected

## Dependencies
- Phase 1 must be completed before Phase 2
- Phase 2 must be completed before Phase 3
- All tasks in Phase 3 can be run in parallel ([P])
- Final Phase tasks depend on completion of all previous phases

## Parallel Execution Examples
- T010–T016 ([P]) in Phase 3 can be executed in parallel as they touch different files

## Implementation Strategy
- MVP: Complete all tasks in Phase 3 (User Story 1) for a working scaffold with tests
- Incremental delivery: Polish and cross-cutting tasks can be added after MVP

## Task Summary
- Total tasks: 20
- User story tasks: 7 (T010–T016)
- Parallel opportunities: 7 (T010–T016)
- Independent test criteria: All tasks in Phase 3 are independently testable
- Suggested MVP scope: Complete all Phase 3 tasks ([US1])

## Format Validation
All tasks follow the required checklist format: `- [ ] Txxx [P?] [USn?] Description with file path`.
