# Brainy — Knowledge Assistant

A monorepo project for the Brainy knowledge assistant, including a server with SQLite vector search and a VS Code extension.

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
