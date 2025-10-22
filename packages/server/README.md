# Brainy Server

This is the backend server for the Brainy knowledge assistant. It provides a REST API and uses SQLite with vector search for hybrid (semantic + keyword) retrieval over Markdown files.

## Features
- REST API for configuration, indexing, and search
- Stores and indexes Markdown files for knowledge management
- Hybrid search using SQLite FTS5 and vector embeddings
- Designed for local, human-readable, and versionable knowledge bases

## Getting Started
1. Install dependencies and build the server:
   ```bash
   npm install
   npm run build
   ```
2. Start the server:
   ```bash
   node dist/server.js
   ```
3. Use the API endpoints to configure and index your knowledge base.

## API Endpoints
- `GET /` — Server status
- `POST /configure` — Configure the workspace and database
- `POST /documents` — Index or update Markdown documents

## Requirements
- Node.js 18+
- SQLite (handled automatically)

## Development
- Source code: `src/`
- Unit tests: `src/server.test.ts`
- Example markdown files: `examples/`

## License
MIT
