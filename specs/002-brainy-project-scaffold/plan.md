src/
tests/
ios/ or android/
directories captured above]

# Status: [Draft/In Review/Approved]


# Implementation Plan: Brainy Project Scaffolding and Test Setup

## Related Docs
- See mcp-insight project structure and documentation for reference.
- [Concept: Filesystem Markdown Knowledge Base with Hybrid Search](../../../../ai-instructions/information/brainy-preparation/concept-ideas.md)
- [Local Vector & Hybrid Search DBs for LLM Agent Memory](../../../../ai-instructions/information/brainy-preparation/local_vector_hybrid_db_llm_agent_2025.md)
- [Personalized Topic-Specific Knowledge Agent](../../../../ai-instructions/information/brainy-preparation/personalized_knowledge_agent.md)
- [SQLite Vector Hybrid Search Guide](../../../../ai-instructions/information/brainy-preparation/sqlite_vector_hybrid_search.md)
- [Hybrid Search Overview](../../../../ai-instructions/information/brainy-preparation/md-example/hybrid-search-overview.md)
- [Keyword Search Basics](../../../../ai-instructions/information/brainy-preparation/md-example/keyword-search-basics.md)
- [Vector Search Basics](../../../../ai-instructions/information/brainy-preparation/md-example/vector-search-basics.md)

## Assumptions
- The knowledge base will use Markdown (.md) files on the filesystem for all content storage.
- Hybrid search (vector + keyword) will be used for retrieval, leveraging SQLite with vector extension.
- The project will follow a monorepo structure with server and VS Code extension packages.
- Example tests and entry points will be provided for all packages, and must run successfully.
- No business logic will be included in the scaffold; only structure, config, and working examples.

## Open Questions
- Are there any additional packages or tools (beyond those in mcp-insight) required for Brainy? No, this is about boilerplaiting the project without the bussines logic
- Should the initial scaffold include example tests for both server and extension? Yes

## Summary
This plan sets up the Brainy project as a monorepo, mirroring the mcp-insight structure. The server package will use SQLite with vector search for hybrid (semantic + keyword) retrieval over Markdown files. The VS Code extension will provide integration and example activation. All packages will include working entry points and example tests. Best practices from the provided research files will be followed for hybrid search, feedback-driven learning, and agent extensibility.
## Dependencies
- Node.js and npm
- TypeScript
- Vitest
- Playwright
- VS Code extension API
- SQLite with vector search support (e.g., lancedb, better-sqlite3, or similar)

## Functional Requirements
- [FR-001] Monorepo structure with server and VS Code extension packages, matching mcp-insight.
- [FR-002] TypeScript configuration for both packages.
- [FR-003] Vitest unit tests and Playwright E2E tests included and passing.
- [FR-004] Server package includes SQLite with vector search support and a working hello-world endpoint.
- [FR-005] Extension package includes a working activation and command.
- [FR-006] All scripts (build, test, etc.) work as expected.

## Non-Functional Requirements
- [NFR-001] Easy setup for new contributors (single command for install/build/test).
- [NFR-002] Tests must run locally and in CI environments.

## Testing Approach
- All requirements will be tested by running the provided example tests (unit and E2E) in both packages.
- Entry points will be manually run to confirm hello-world/activation behavior.
- CI will be configured to run all tests on push/PR.

## Acceptance Criteria
- [AC-001] Developer can clone the repo, install dependencies, and build both packages with a single command.
- [AC-002] All example tests pass for both server and extension.
- [AC-003] Entry points for server and extension run and show expected hello world/activation behavior.
- [AC-004] Playwright E2E test for the extension runs and passes.
- [AC-005] Documentation clearly explains setup and test processes.
