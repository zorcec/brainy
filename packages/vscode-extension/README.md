# Brainy VS Code Extension

This extension integrates the Brainy knowledge assistant into Visual Studio Code.

## Features
- Connects to the local Brainy server for hybrid (vector + keyword) search
- Indexes and retrieves Markdown knowledge base files
- Provides commands for configuration and search

## Getting Started
1. Install dependencies and build the project:
   ```bash
   npm install
   npm run build
   ```
2. Launch VS Code and open your workspace.
3. Activate the extension. The Brainy server will start automatically.
4. Use the `Brainy: Configure Workspace` command to set up your knowledge base.

## Requirements
- Node.js 18+
- Brainy server (included in this monorepo)

## Development
- Source code: `src/`
- Unit tests: `src/extension.test.ts`
- E2E tests: `e2e/`

## License
MIT
