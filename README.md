# Brainy — Knowledge Assistant


[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) — High-level project summary, architecture, and main features.
[copilot-instructions.md](.github/copilot-instructions.md) — Quick reference for agents and contributors, with key links and descriptions.

A monorepo project for the Brainy knowledge assistant, including a server with SQLite vector search and a VS Code extension.

---

## 📚 README Index

| Path | Description |
|------|-------------|
| [README.md](README.md) | Root project overview and quickstart |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | High-level project summary, architecture, and main features |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Quick reference for agents and contributors |
| [specs/README.md](specs/README.md) | Index of all feature specifications and plans |
| [specs/001-brainy-knowledge-assistant/README.md](specs/001-brainy-knowledge-assistant/README.md) | Core requirements, user stories, and validation checklists |
| [specs/002-brainy-project-scaffold/README.md](specs/002-brainy-project-scaffold/README.md) | Implementation plan, monorepo structure, and scaffolding details |
| [packages/server/README.md](packages/server/README.md) | Brainy server: API, setup, and development guide |
| [packages/server/examples/README.md](packages/server/examples/README.md) | Example markdown files for the knowledge base |
| [packages/vscode-extension/README.md](packages/vscode-extension/README.md) | VS Code extension: features, setup, and usage |
| [information/README.md](information/README.md) | Information directory overview |
| [information/index.md](information/index.md) | Index of all information files and directories |
| [information/brainy-preparation/README.md](information/brainy-preparation/README.md) | Foundational research and concept docs |
| [information/brainy-preparation/md-example/README.md](information/brainy-preparation/md-example/README.md) | Example markdowns for search concepts |
| [.github/README.md](.github/README.md) | GitHub configuration and workflow files |
| [.github/prompts/README.md](.github/prompts/README.md) | Prompt instruction files for automation |
| [.specify/README.md](.specify/README.md) | Project specification and automation configs |
| [.specify/templates/README.md](.specify/templates/README.md) | Templates for scaffolding and automation |
| [.specify/scripts/README.md](.specify/scripts/README.md) | Automation and setup scripts |
| [.specify/scripts/bash/README.md](.specify/scripts/bash/README.md) | Bash scripts for automation |
| [.specify/memory/README.md](.specify/memory/README.md) | Memory/cache for automation tools |
| [test-results/README.md](test-results/README.md) | Test result outputs and logs |
| [specs/001-brainy-knowledge-assistant/checklists/README.md](specs/001-brainy-knowledge-assistant/checklists/README.md) | Checklists for the knowledge assistant spec |

---


## Status

✅ **Project Scaffolding Complete** — All tests passing, ready for development

## Project Structure

```
brainy/
├── packages/
│   ├── server/          # Server with SQLite vector search
│   │   ├── src/         # Source files
│   │   ├── dist/        # Built files
│   │   └── examples/    # Example markdown knowledge base files
│   └── vscode-extension/ # VS Code extension
│       ├── src/         # Source files
│       ├── e2e/         # End-to-end tests
│       └── dist/        # Built files
├── specs/               # Feature specifications
├── package.json         # Root workspace config
└── playwright.config.ts # E2E test config
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
