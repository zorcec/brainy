# Brainy — Knowledge Assistant

[project-overview.md](./project-overview.md) — High-level project summary, architecture, and main features.

A monorepo project for the Brainy knowledge assistant, including a server with SQLite vector search and a VS Code extension.

## Contribution

 See [Information Directory README](./information/README.md) for documentation structure
 See [Server README](./packages/server/README.md) and [VS Code Extension README](./packages/vscode-extension/README.md) for implementation details
 See [SkillApi Usage Examples](./information/project/docs/skillapi-usage-examples.md) for skill development and API usage

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
│   ├── server/              # Backend server (README: ./packages/server/README.md)
│   └── vscode-extension/    # VS Code extension (README: ./packages/vscode-extension/README.md)
├── packages/
│   ├── server/               # Brainy server (API, SQLite vector search)
│   │   ├── src/              # Source files
│   │   │   ├── db/           # Database logic
│   │   │   └── routes/       # API route handlers
│   │   ├── dist/             # Built files
│   │   └── examples/         # Example markdown knowledge base files
│   └── vscode-extension/     # VS Code extension
│       ├── src/              # Source files
│       │   ├── parser/       # Markdown parser (annotations, flags, etc.)
│       │   └── skills/       # Skills system (API, model client, skill runner)
│       ├── e2e/              # End-to-end tests
│       │   └── test-project/ # Test project with sample playbooks and skills
│       │       └── .brainy/  # Test workspace configuration
│       │           └── skills/ # Example skills (execute.js, execute.ts)
│       └── dist/             # Built files
├── test-results/             # Test result outputs and logs
├── package.json              # Root workspace config
└── playwright.config.ts      # E2E test config
```

## Skills Directory Convention

Custom skills should be placed in the `.brainy/skills` directory in your workspace:

```
your-workspace/
└── .brainy/
    └── skills/
        ├── execute.ts       # Custom TypeScript skill
        ├── task.js          # Custom JavaScript skill
        └── context.js       # Another custom skill
```

- **Skill Discovery**: The extension automatically scans `.brainy/skills` for `.js` and `.ts` files
- **Dynamic Highlighting**: Only annotations matching available skills are highlighted (case-sensitive)
- **Live Updates**: Adding or removing skills triggers automatic re-highlighting
- **Error Detection**: Missing skill references show editor errors with hover information

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

Run unit tests (326 tests passing):

```bash
npm test
```

**Test Breakdown:**
- **Parser Tests:** 111 tests for markdown annotation and code block parsing
- **Skills Tests:** 60 tests for skill system (API, model client, session store, skill runner)
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

**E2E Tests:** Real browser automation with Playwright, launching VS Code Web and interacting with the UI
- Tests launch VS Code Web with the extension loaded using `@vscode/test-web`
- Playwright clicks buttons, inspects decorations, and verifies output
- Worker-scoped VS Code servers for parallel execution with optimal performance
- Tests run in parallel with 4 workers, completing in ~2 minutes
- Automatically exits on both success and failure with appropriate exit codes
- Screenshots and traces captured on failure in `test-results/`
- Run with `npm run e2e:headed` to see the browser in action
- See [E2E Testing Guide](./packages/vscode-extension/e2e/README.md) for details
- See [E2E Fixtures Documentation](./packages/vscode-extension/e2e/FIXTURES.md) for fixture architecture

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
