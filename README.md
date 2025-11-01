# Brainy — Knowledge Assistant

[project-overview.md](./project-overview.md) — High-level project summary, architecture, and main features.

A monorepo project for the Brainy knowledge assistant, including a server with SQLite vector search and a VS Code extension.

## Status

**Parser Implementation:** ✅ Complete
- Generic markdown annotation parser implemented with code block support
- 111 unit tests, all passing (includes 20 new code block tests)
- See [parser README](./packages/vscode-extension/src/parser/README.md) for details

## Contribution

- Update `information/index.md` when adding new documentation or research files
- Update `information/tickets/` when adding new epics or user stories
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
│   ├── project/              # Project overview and preparation
│   │   └── preparation/      # Foundational research and examples
│   │       └── md-graph-example/ # Example markdowns for search concepts
│   └── tickets/              # User stories and epics
│       ├── 001-initiate-the-structure/
│       ├── 002-markdown-parser/
│       ├── 003-skills-system/
│       └── 004-context-manager/
├── packages/
│   ├── server/               # Brainy server (API, SQLite vector search)
│   │   ├── src/              # Source files
│   │   │   ├── db/           # Database logic
│   │   │   └── routes/       # API route handlers
│   │   ├── dist/             # Built files
│   │   └── examples/         # Example markdown knowledge base files
│   └── vscode-extension/     # VS Code extension
│       ├── src/              # Source files
│       │   └── parser/       # Markdown parser (annotations, flags, etc.)
│       ├── e2e/              # End-to-end tests
│       └── dist/             # Built files
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

Run unit tests (127 tests passing):

```bash
npm test
```

**Parser Tests:** 111 tests for markdown annotation and code block parsing
**Extension Tests:** 4 tests for VS Code extension
**Server Tests:** 12 tests for API and database

Run E2E tests:

```bash
npm run e2e
```

**E2E Tests:** Real browser automation with Playwright, launching VS Code Web and interacting with the UI
- Tests launch VS Code Web with the extension loaded
- Playwright clicks buttons, inspects decorations, and verifies output
- Screenshots captured on failure in `test-results/`
- Run with `npm run e2e:headed` to see the browser in action

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
3. VS Code extension commands for indexing and searching
4. Integration between extension and server

See `information/tickets/` directory for detailed epics and user stories.
