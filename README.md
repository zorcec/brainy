# Brainy — Knowledge Assistant


[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — High-level project summary, architecture, and main features.
[copilot-instructions.md](.github/copilot-instructions.md) — Quick reference for agents and contributors, with key links and descriptions.

A monorepo project for the Brainy knowledge assistant, including a server with SQLite vector search and a VS Code extension.

## Status

- [Information File Index](information/index.md)
- [Project Overview](information/project/overview.md)
- [Spec-driven Development Workflow](../ai-instructions/information/spec-driven-dev/simplified-workflow.md)

## Contribution

- Update `information/index.md` when adding new documentation or research files
- Update `specs/` when adding new specifications or checklists
- Follow best practices for code and documentation

## Project Structure

```
brainy/
├── .github/                  # GitHub config, workflows, prompts
│   └── prompts/              # Prompt instruction files
├── .specify/                 # Project specification and automation configs
│   ├── templates/            # Templates for scaffolding
│   ├── scripts/              # Automation scripts
│   │   └── bash/             # Bash scripts
│   └── memory/               # Memory/cache for automation tools
├── information/              # Research, concept, and technical docs
│   ├── brainy-preparation/   # Foundational research and examples
│   │   └── md-example/       # Example markdowns for search concepts
├── packages/
│   ├── server/               # Brainy server (API, SQLite vector search)
│   │   ├── src/              # Source files
│   │   │   ├── db/           # Database logic
│   │   │   └── routes/       # API route handlers
│   │   ├── dist/             # Built files
│   │   └── examples/         # Example markdown knowledge base files
│   └── vscode-extension/     # VS Code extension
│       ├── src/              # Source files
│       ├── e2e/              # End-to-end tests
│       └── dist/             # Built files
├── specs/                    # Feature specifications
│   ├── 001-brainy-knowledge-assistant/
│   │   ├── checklists/       # Validation checklists
│   └── 002-brainy-project-scaffold/
├── test-results/             # Test result outputs and logs
├── package.json              # Root workspace config
└── playwright.config.ts      # E2E test config
```

## Setup

Install dependencies for all packages:

```bash
npm install
```

## Build

Build all packages:

```bash
npm run build
```

## Test

Run unit tests (7 tests passing):

```bash
npm test
```

Run E2E tests:

```bash
npm run e2e
```

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

This scaffold provides the foundation for building the Brainy knowledge assistant. The next phase involves implementing:

1. Vector embedding generation and storage
2. Hybrid search functionality
3. VS Code extension commands for indexing and searching
4. Integration between extension and server

See `specs/` directory for detailed specifications and task breakdowns.
