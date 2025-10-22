# Brainy Project Overview & Architecture

## Purpose
Brainy is a knowledge assistant that enables hybrid (vector + keyword) search over Markdown-based knowledge bases, with a local server and a VS Code extension for seamless integration.

## Main Features
- Hybrid search (vector + keyword) over Markdown files
- Local SQLite backend with vector search support
- VS Code extension for in-editor access
- Modular, extensible architecture

## Architecture
- **Server**: Node.js/TypeScript, SQLite (with vector search), REST API
- **VS Code Extension**: TypeScript, communicates with the server, provides UI/commands
- **Knowledge Base**: Markdown files, indexed and queried by the server

## Key Specs & Documents
- [001-brainy-knowledge-assistant/spec.md](specs/001-brainy-knowledge-assistant/spec.md): Core requirements, user stories, and checklists
- [002-brainy-project-scaffold](specs/002-brainy-project-scaffold/): Monorepo structure, build/test setup, and implementation plan

## Project Structure
- `packages/server/`: Server code and database logic
- `packages/vscode-extension/`: VS Code extension
- `specs/`: Feature specifications and checklists

## See Also
- [README.md](README.md): Quickstart, setup, and development instructions
- [AGENT.md](AGENT.md): Key links and resources for agents/contributors
