

# Status: Draft

# Spec: Brainy Knowledge Assistant

## Related Docs
- See project README and research docs in `/information/` for context on knowledge management and AI assistant goals.

## Assumptions
- Users are software developers or architects who value local, human-readable, and versionable knowledge bases.
- Markdown is the preferred format for notes and research.
- Users want both manual and AI-assisted knowledge capture and retrieval.
- Feedback from users and agents will be available to improve recommendations.
- Integration with VS Code and browsers is feasible via extensions or plugins.

## Open Questions


## What
Brainy is an AI-powered personal knowledge assistant designed to help software developers and architects collect, organize, and retrieve their notes, research, and ideas. It enables both users and AI agents to gather and organize knowledge, including fetching and summarizing external web pages. Brainy uses Markdown files on the local filesystem as its knowledge base, ensuring all data is human-readable, portable, and versionable. The system supports effortless capture and organization, powerful hybrid search (semantic/vector and keyword), context-aware suggestions, feedback-driven learning, explicit and automatic linking between documents, and integration with popular tools for seamless workflows. The goal is to mimic human research and memory, surfacing the most useful information at the right time and making personal knowledge management intelligent, adaptive, and enjoyable.

## Dependencies
- Local filesystem access for reading/writing Markdown files
- Integration points for VS Code and browser extensions
- Access to AI models (local or cloud) for semantic search and suggestions

## Who
- Primary: Software developers and architects managing personal or project knowledge
- Secondary: AI agents supporting users in research, organization, and retrieval tasks

## Why
Developers and architects often struggle to organize and retrieve their growing body of notes, research, and ideas. Existing tools are either too rigid, not AI-powered, or do not support local, human-readable storage. Brainy addresses these gaps by making knowledge capture effortless, retrieval powerful and context-aware, and learning adaptive to user feedback, all while keeping data portable and versionable.

## Functional Requirements
- [FR-001] Users can capture and organize notes, research, and ideas as Markdown files via a simple interface.
- [FR-002] AI agents can fetch, summarize, and add external web content to the knowledge base.
- [FR-003] Hybrid search (semantic/vector and keyword) enables users to find relevant content across large knowledge bases.
- [FR-004] The system provides context-aware suggestions and retrieval, surfacing related or associated knowledge.
- [FR-005] Users and agents can provide feedback on search results and suggestions, improving future recommendations.
- [FR-006] Explicit and automatic linking between documents supports knowledge graph-style navigation.
- [FR-007] VS Code extension starts the MCP server, tracks file changes in the workspace, and passes them to the MCP server for indexing.
- [FR-008] VS Code extension integrates MCP and GitHub Copilot for an enhanced user experience.
- [FR-009] All knowledge is stored as Markdown files within the VS Code workspace; all features work locally except for GitHub Copilot and online learning resources.


## Non-Functional Requirements
- [NFR-001] All data must remain human-readable and portable (Markdown format).
- [NFR-002] The system must perform hybrid search across large knowledge bases in under 2 seconds for typical queries.
- [NFR-003] Feedback-driven learning must not degrade user experience or data integrity.
- [NFR-004] The system must be extensible to support additional integrations and AI models in the future.

## Test Cases
- [TC-001] User captures a note and verifies it is saved as a Markdown file in the knowledge base.
- [TC-002] AI agent fetches a web page, summarizes it, and adds the summary to the knowledge base as Markdown.
- [TC-003] User searches for a topic and receives both direct matches and semantically related results within 2 seconds.
- [TC-004] User provides feedback on a suggestion, and future recommendations improve accordingly.
- [TC-005] System automatically links related documents.
- [TC-006] VS Code extension starts the MCP server, tracks file changes, and passes them to the MCP server for indexing.
- [TC-007] User experiences seamless integration between MCP and GitHub Copilot in VS Code.
- [TC-008] System continues to function with a very large knowledge base (e.g., thousands of Markdown files) without significant performance degradation.
- [TC-009] System handles conflicting feedback from users/agents gracefully.
