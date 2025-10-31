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

## Project Structure
- `packages/server/`: Node.js/TypeScript server, SQLite DB, REST API, vector search logic
- `packages/vscode-extension/`: VS Code extension (TypeScript), UI, commands, server communication
- `information/`: Project documentation, concept ideas, technical notes
- `specs/`: Feature specifications and design docs
- `test-results/`: Automated and manual test outputs

## See Also
- [README.md](README.md): Quickstart, setup, and development instructions
- [information/index.md](information/index.md): Documentation and knowledge base index
- [specs/index.md](specs/index.md): Feature specs and design docs
