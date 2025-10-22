---
description: 'Concept: Using .md files on the filesystem as a knowledge base with hybrid (vector + keyword) search.'
keywords: ['filesystem', 'markdown', 'hybrid search', 'vector search', 'knowledge base', 'LLM agent', 'semantic search', 'Qdrant', 'Weaviate', 'pgvector', 'Redis']
---

# Concept: Filesystem Markdown Knowledge Base with Hybrid Search

## Idea
- Store all documents as Markdown (.md) files on the filesystem.
- Use a hybrid search engine (Qdrant, Weaviate, Redis, pgvector, etc.) to index and search these files.

## How It Works
1. **Storage:**
   - Each document is a .md file on disk (easy to edit, version, and back up).
2. **Indexing:**
   - The search engine indexes:
     - File content (for keyword/full-text search)
     - Vector embeddings of content (for semantic/vector search)
     - Metadata (file path, tags, etc.)
3. **Search:**
   - Hybrid queries (keyword + semantic) return references/paths to .md files.
   - The app or agent can open, link, or relate to the actual .md file.

## Benefits
- Human-readable, portable, and versionable knowledge base.
- Combines the flexibility of plain files with modern search capabilities.
- Enables LLM agents and users to relate, retrieve, and update knowledge easily.

## Typical Stack
- **Storage:** Filesystem (.md files)
- **Index/Search:** Qdrant, Weaviate, Redis (RediSearch), pgvector, or similar
- **Embedding:** Local or cloud embedding model (e.g., MiniLM, OpenAI, etc.)
- **App/Agent:** VS Code extension, CLI, or web app

## Use Cases
- Personal or team knowledge base
- LLM agent memory
- Research archives
- Documentation systems

## Notes
- This approach is used in modern PKM (personal knowledge management) and RAG (retrieval-augmented generation) systems.
- Hybrid search enables both precise keyword lookup and semantic discovery.

## Building Relationships Between Topics and Documents

To create rich, human-like relationships between topics and documents in a knowledge base:

1. **Extract and Index Keywords/Entities:**
   - Use NLP to extract key topics, entities, and phrases from each document.
   - Store these as metadata (tags, topics, named entities).

2. **Generate Embeddings for Topics and Keywords:**
   - Create vector embeddings for extracted keywords/topics as well as for full documents.
   - This allows semantic linking between related concepts, not just exact matches.

3. **Link Documents by Shared Topics/Embeddings:**
   - Relate documents that share similar keywords, topics, or have high embedding similarity.
   - Build a graph or index of these relationships (e.g., document A and B both relate to topic X).

4. **Store Explicit Relationships:**
   - Allow users or agents to create explicit links ("related to", "cites", "expands on") between documents.
   - Store these as edges in a knowledge graph or as metadata.

5. **Use Hybrid Search to Surface Connections:**
   - When searching, return not just direct matches but also related documents via shared topics, embeddings, or graph links.

6. **Visualize or Query the Relationship Graph:**
   - Optionally, visualize the network of topics and documents, or allow queries like "show all docs related to X".

**Summary:**
- Extract keywords/topics and generate embeddings for both documents and topics.
- Relate documents by shared keywords, semantic similarity, and explicit links.
- Use hybrid search and knowledge graph techniques to surface and navigate these relationships.

_Last updated: October 21, 2025_

### Syntax for Explicit/User-Defined Links

You can represent explicit links in Markdown or metadata in several ways:

**1. Markdown Link (Standard):**
```
[Related: Document Title](./document-title.md)
```

**2. Custom Link Types (in Markdown):**
```
[Expands on: Topic X](./topic-x.md)
[Contradicts: Theory Y](./theory-y.md)
[See also: Related Doc](./related-doc.md)
```

**3. YAML Frontmatter Metadata:**
```yaml
---
related:
  - ./document-title.md
expands_on:
  - ./topic-x.md
contradicts:
  - ./theory-y.md
---
```

**4. Inline Tags or Annotations:**
```
@related(./document-title.md)
@expands_on(./topic-x.md)
```

**5. Knowledge Graph Edge (for systems):**
```
Document A --[expands_on]--> Document B
```

### Common Verbs for Explicit Links

You can use a variety of verbs to express different relationships between documents/topics. Some useful ones include:

- **related**: General association (most common, broad)
- **expands_on**: Adds detail, depth, or further explanation
- **contradicts**: Presents an opposing or conflicting view
- **supports**: Provides evidence or backing
- **cites**: References or quotes another document
- **summarizes**: Condenses or abstracts the content
- **see_also**: Suggests further reading (like "related")
- **depends_on**: Requires understanding of another topic
- **corrects**: Fixes or updates information in another doc

**Are expands_on and contradicts needed?**
- Not required, but they add nuance. Use them if you want to capture specific types of relationships, not just general association.
- For most workflows, **related** and **see_also** are enough, but more verbs help with advanced navigation, knowledge graphs, or reasoning.
- **related** is enough to start with.

**Choose the style that fits your workflow and tools.** Most knowledge management systems can parse Markdown links and/or YAML frontmatter for relationships.

## Feedback and Relation Usefulness Tracking

To improve the relevance of relationships between documents, integrate feedback mechanisms:

- Agents and users can signal when a relationship/link was actually useful (e.g., after using retrieved content in a workflow or output).
- Track a usage counter for each relationship in the metadata (YAML frontmatter or a central index).
- Increment the counter each time a relation is proven useful, either by explicit feedback (API call) or implicit signals (content used in output, user interaction).
- When retrieving relations, filter or sort by the highest counters to surface the strongest, most relevant links.
- If integrated with an MCP server, agents or extensions (e.g., VS Code) can automatically report useful relations via an API, enabling real-time, data-driven relevance tracking.

**Example YAML:**
```yaml
related:
  - path: ./keyword-search-basics.md
    count: 5
  - path: ./vector-search-basics.md
    count: 2
```

This approach supports continuous improvement of your knowledge base by dynamically scoring and filtering relationships based on actual usefulness.

## Simple Document Linking and Retrieval Plan

This plan describes a practical approach for building and using a Markdown-based knowledge base with hybrid search, focusing on document-level linking and scoring:

1. **Document-Level Linking:**
   - Each Markdown document includes a list of related documents in its metadata (YAML frontmatter).
   - Each relation has a usage counter (score) that is incremented whenever the link is proven useful by agents or users.

2. **Hybrid Search and Chunking:**
   - The backend (e.g., MCP server) uses hybrid search (keyword + semantic) to find all relevant documents for a query.
   - Each document is split into chunks at top-level and sub-level headings (`#`, `##`).
   - Chunks inherit the document's relation scores for ranking.

3. **Context Management:**
   - Chunks from the most relevant documents (highest relation scores) are selected and ordered to fit within the context limit for agent reasoning.
   - Less relevant chunks are dropped if they exceed the context window.

4. **Feedback and Scoring:**
   - Agents and users provide feedback when a document relation is useful (e.g., used in output, accepted by user).
   - The usage counter for that relation is incremented, improving future ranking.

5. **Workflow Summary:**
   - Link documents with usage counters.
   - Use hybrid search to retrieve and rank document chunks.
   - Fit the most relevant chunks into the agent's context window.
   - Continuously improve link scores with feedback.

This approach is simple, maintainable, and effective for most practical agent workflows, supporting efficient retrieval and reasoning without the complexity of fine-grained relation types.

## Practical Chunk Scoring for Hybrid Search

To select the most relevant document chunks for agent context, use a scoring formula that combines document-level and chunk-level relevance:

### Chunk Scoring Formula

For each chunk:

chunk_score = α × doc_relation_score + β × chunk_semantic_relevance + γ × chunk_keyword_relevance

Where:
- doc_relation_score: Usage counter of the parent document (higher means more proven usefulness)
- chunk_semantic_relevance: Embedding similarity between the chunk and the query
- chunk_keyword_relevance: Keyword match score between the chunk and the query
- α, β, γ: Tunable weights (e.g., α=1, β=2, γ=1)

### Example

Suppose:
- Document A has a relation score (counter) of 5
- Chunk 1 from Document A has a semantic similarity of 0.8 and keyword match score of 0.6 to the query
- Weights: α=1, β=2, γ=1

Calculation:
chunk_score = 1 × 5 + 2 × 0.8 + 1 × 0.6 = 5 + 1.6 + 0.6 = 7.2

### Usage
- Calculate scores for all candidate chunks
- Sort chunks by score
- Select the top chunks that fit the context window for agent reasoning

This approach enables dynamic, data-driven selection of the most relevant information for agents, optimizing context usage and reasoning quality.

## Practical Agent-Backend Feedback Workflow for Relation Tracking

To reliably track which document relations are used by agents, implement the following workflow:

### 1. Agent Tracking Logic
- When the agent retrieves related documents (via hybrid search), it records the IDs/paths of all candidate relations.
- During reasoning or output generation, the agent tracks which related documents are actually used (e.g., cited, referenced, or included in the final result).

### 2. Feedback API
- The agent sends a feedback payload to the backend (e.g., MCP server) after completing its workflow.
- Example payload:
  ```json
  {
    "agent_id": "copilot-123",
    "query": "How does hybrid search work?",
    "used_relations": [
      "./hybrid-search-overview.md",
      "./keyword-search-basics.md"
    ]
  }
  ```
- The backend increments the usage counter for each reported relation in the metadata or central index.

### 3. Implicit and Explicit Feedback
- Implicit: The agent can parse its own output for citations, links, or content from related documents and report those as used relations.
- Explicit: The agent or user can confirm usefulness (e.g., "Was this information helpful?") and only increment counters for confirmed relations.

### 4. User Experience
- By default, this tracking is transparent to the user; agents and backend handle feedback behind the scenes.
- Optionally, you can display which documents or relations were used in the agent’s response (e.g., "Sources: DocA, DocB") or show usage stats if desired.

### 5. Backend-Agent Communication
- MCP can instruct agents (via API contract, configuration, or workflow metadata) to track and report used relations after each workflow.
- This enables reliable, automated feedback and dynamic relevance scoring for future queries.

**Summary:**
- Agents track and report used relations to the backend via a feedback API.
- Backend updates usage counters, improving future relevance and retrieval.
- The process is transparent to users unless you choose to surface it in the UI.
