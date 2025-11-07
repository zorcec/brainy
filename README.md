# Brainy — Knowledge Assistant

[Project Overview](./project-overview.md) — High-level summary, architecture, and main features.

Brainy is a monorepo for a knowledge assistant, including a server with SQLite vector search and a VS Code extension.

## Contribution & Documentation

- See [Information Directory README](./information/README.md) for documentation structure.
- See [Server README](./packages/server/README.md) and [VS Code Extension README](./packages/vscode-extension/README.md) for implementation details.
- See [SkillApi Usage Examples](./information/project/docs/skillapi-usage-examples.md) for skill development and API usage.
- See [Testing Best Practices for Built-in Skills](./information/project/docs/testing-best-practices-for-skills.md) for skill test guidelines.
- See [Information Index](./information/index.md) for a full list of documentation files.
- See [Tickets Index](./information/tickets/tasks-collection.md) for epics and user stories.

## Project Structure

```
brainy/
├── .github/                  # GitHub config, workflows, prompts
│   ├── instructions/         # AI agent and coding instructions
│   └── prompts/              # Prompt instruction files for Copilot and LLMs
├── .specify/                 # Project specification and automation configs
│   ├── templates/            # Scaffolding templates for new features and docs
│   ├── scripts/              # Automation scripts (bash, node, etc.)
│   │   └── bash/             # Bash scripts for setup and maintenance
│   └── memory/               # Memory/cache for automation tools and agents
├── information/              # Research, concept, and technical docs
│   ├── index.md              # Index of all documentation files
│   ├── README.md             # Information directory overview
│   ├── project/              # Project overview, architecture, and preparation
│   │   ├── overview.md       # High-level project summary
│   │   ├── docs/             # API usage, skill development, testing guides
│   │   └── preparation/      # Foundational research, concept ideas, workflows
│   │       └── md-graph-example/ # Example markdowns for search concepts
│   └── tickets/              # User stories, epics, and implementation plans
│       ├── ideas.md          # Idea backlog
│       ├── plan.md           # Roadmap and planning
│       ├── tasks-collection.md # Index of tickets and tasks
│       ├── 001-initiate-the-structure/ # Initial setup epics
│       ├── 002-markdown-parser/        # Markdown parser development
│       ├── 003-skills-system/          # Skills system development
│       ├── 004-md-support/             # Markdown support features
│       ├── 005-e2e-tests-optimization/ # E2E test optimization
│       ├── 006-playbook-execution-engine/ # Playbook execution engine
│       ├── 007-epic-improve-e2e-tests-setup/ # E2E test setup improvements
│       ├── 008-skills-system-expansion/ # Skills system expansion
│       └── other/                      # Miscellaneous tickets
├── packages/
│   ├── server/               # Backend server (README: ./packages/server/README.md)
│   │   ├── package.json      # Server package config
│   │   ├── README.md         # Server documentation
│   │   ├── tsconfig.json     # TypeScript config
│   │   ├── src/              # Source files
│   │   │   ├── db/           # Database logic and models
│   │   │   └── routes/       # API route handlers
│   │   ├── dist/             # Built files
│   │   └── examples/         # Example markdown knowledge base files
│   └── vscode-extension/     # VS Code extension (README: ./packages/vscode-extension/README.md)
│       ├── package.json      # Extension package config
│       ├── README.md         # Extension documentation
│       ├── tsconfig.json     # TypeScript config
│       ├── vitest.config.ts  # Vitest test config
│       ├── src/              # Extension source files
│       │   ├── parser/       # Markdown parser (annotations, flags, etc.)
│       │   └── skills/       # Skills system (API, model client, skill runner)
│       ├── e2e/              # End-to-end tests
│       │   ├── README.md     # E2E test documentation
│       │   ├── FIXTURES.md   # E2E fixtures architecture
│       │   └── test-project/ # Test project with sample playbooks and skills
│       │       └── .brainy/  # Test workspace configuration
│       │           └── skills/ # Example skills (execute.js, execute.ts)
│       ├── test-results/     # E2E test outputs and logs
│       └── dist/             # Built extension files
├── test-results/             # Workspace-wide test result outputs and logs
├── playwright-report/        # Playwright E2E test reports and traces
├── package.json              # Root workspace config
└── playwright.config.ts      # E2E test config
```

### Directory Details

- **.github/**: Project automation, agent instructions, and prompt files for Copilot/LLMs.
- **.specify/**: Specification-driven development, scaffolding, and automation scripts.
- **information/**: All documentation, research, concept notes, and tickets. Includes indexes and guides for navigation.
- **packages/server/**: Node.js backend with SQLite vector search, API routes, and example knowledge bases.
- **packages/vscode-extension/**: VS Code extension source, skills system, markdown parser, E2E tests, and documentation.
- **test-results/**: Aggregated test outputs and logs for all packages.
- **playwright-report/**: Playwright E2E test reports, traces, and debugging artifacts.
- **package.json**: Root workspace configuration and scripts.
- **playwright.config.ts**: Playwright E2E test configuration.
Run unit tests (574 tests passing):

```bash
npm test
```

**Test Breakdown:**
- **Parser Tests:** 111 tests for markdown annotation and code block parsing
- **Skills Tests:** 101 tests for skill system (API, model client, session store, skill runner, built-in skills)
- **Extension Tests:** 4 tests for VS Code extension (2 failing due to pre-existing issues)
- **Server Tests:** 12 tests for API and database
- **Markdown Tests:** 40 tests for annotation highlighting and play button

**Skills System:**
- 19 tests for skill runner (JavaScript and TypeScript skill loading and execution)
- All skill runner tests passing ✅
- TypeScript support verified with ts-node integration

Run E2E tests:

```bash
npm run e2e
```

**E2E Tests:** Real VS Code Desktop automation with Playwright via Chrome DevTools Protocol (CDP)
- Tests launch VS Code Desktop (Electron) with the extension loaded using `@vscode/test-electron`
- Playwright connects via CDP and interacts with the VS Code UI (click buttons, inspect decorations, verify output)
- Worker-scoped VS Code Desktop instances for parallel execution with optimal performance
- Tests run in parallel with 4-8 workers, completing in ~3 minutes
- Full access to Node.js APIs and extension-host features
- Automatically exits on both success and failure with appropriate exit codes
- Screenshots and traces captured on failure in `test-results/`
- Run with `npm run e2e:headed` to see VS Code Desktop windows
- See [E2E Testing Guide](./packages/vscode-extension/e2e/README.md) for details
- See [E2E Fixtures Documentation](./packages/vscode-extension/e2e/FIXTURES.md) for fixture architecture

**Note:** Web-based E2E testing is deprecated. All tests run in VS Code Desktop mode only.

## Development

Watch mode for tests:

```bash
npm run test:watch
```

Run the server directly:

```bash
node packages/server/dist/server.js
```

## Requirements

- Node.js 18+
- npm 9+

## Architecture

- **Server**: Node.js server with SQLite vector search for hybrid (semantic + keyword) retrieval over Markdown files
- **Extension**: VS Code extension providing integration with the Brainy knowledge assistant

## Tech Stack

- TypeScript
- Vitest (unit tests)
- Playwright (E2E tests)
- SQLite with vector search (better-sqlite3)
- VS Code Extension API

## Next Steps

This scaffold provides the foundation for building the Brainy knowledge assistant.

**Completed:**
- ✅ Markdown parser for annotations, flags, and workflow definitions

**Next Phase:**

1. Code block extraction and execution context
2. Context combination and management
3. Vector embedding generation and storage
4. Hybrid search functionality
5. VS Code extension commands for indexing and searching
6. Integration between extension and server

See [Information Index](./information/index.md) and [Tickets Index](./information/tickets/tasks-collection.md) for detailed epics and user stories.
