---
description: 'How to store and search embeddings for content, title, and keywords in SQLite with vector extension.'
keywords: ['SQLite', 'vector search', 'embeddings', 'keywords', 'hybrid search', 'knowledge base']
---

# Storing and Searching Embeddings for Content, Title, and Keywords in SQLite

## Overview
This guide explains how to use SQLite (with the vector extension) to store and search embeddings for content, title, and keywords in a Markdown-based knowledge base. It covers schema design, embedding strategies, and hybrid search queries.

## Schema Design
Create a table to store each chunk of your Markdown documents, with separate columns for content, title, keywords, and their respective embeddings:

```sql
CREATE TABLE chunks (
  id INTEGER PRIMARY KEY,
  title TEXT,
  title_vector BLOB,      -- embedding for title
  keywords TEXT,
  keywords_vector BLOB,   -- embedding for keywords (aggregate)
  content TEXT,
  content_vector BLOB,    -- embedding for content
  usage_counter INTEGER,
  file_path TEXT
);
```

## Embedding Strategy
- **Content**: Generate an embedding for the chunk's main text and store in `content_vector`.
- **Title**: Generate an embedding for the title and store in `title_vector`.
- **Keywords**: Combine all keywords into a single string (e.g., "vector search, semantic, markdown"), generate one embedding for this string, and store in `keywords_vector`.

### Why Aggregate Keywords?
- Simplicity: One embedding per chunk for keywords is easy to manage and search.
- Performance: Fast similarity queries without joining extra tables.
- Semantic: Captures the overall meaning of all keywords together.


## Hybrid Search Queries
You can combine vector similarity and keyword/title search using SQLite's vector extension and FTS5:

```sql
SELECT
  chunk_id,
  title,
  keywords,
  content,
  usage_counter,
  file_path,
  -- Example hybrid score formula
  (1.0 * usage_counter + 2.0 * semantic_score + 1.0 * keyword_score) AS chunk_score
FROM
  chunks
WHERE
  chunks MATCH 'your keyword query' -- FTS5 keyword search
ORDER BY
  chunk_score DESC
LIMIT 10;
```
- `semantic_score`: Calculated from vector similarity (e.g., cosine distance) between query embedding and stored vectors.
- `keyword_score`: FTS5 keyword match score.
- `usage_counter`: Feedback-based relevance score.

## Context Window and Secondary Pool Strategy

To efficiently manage agent context limits and maximize retrieval quality, use a two-tier approach:

### 1. Primary Context Window
- Pass only the top-scoring chunks (based on hybrid score) to the agent's main context window.
- These chunks are most likely to be relevant and fit within the agent's context constraints.

### 2. Secondary Pool (Fallback)
- Keep lower-scoring chunks in a secondary pool.
- Provide the agent with summaries, titles, or metadata for these chunks (not full content).
- If the agent detects missing information or needs deeper reasoning, it can request specific chunks from the secondary pool by ID or summary.
- Consider including all related document chunks in the secondary pool.

### Benefits
- Keeps the main context focused and efficient.
- Allows the agent to dynamically retrieve additional information as needed.
- Supports interactive, on-demand knowledge retrieval and reduces unnecessary data transfer.

This strategy is especially useful for agent workflows with strict context limits, enabling both high relevance and flexible, deeper exploration.

## Node.js Integration
- Use `better-sqlite3`, `sqlite3`, or similar packages.
- For vector extension: Use a build that includes it, or run as a subprocess.
- FTS5 is built-in to most modern SQLite builds.

## Summary
- Store embeddings for content, title, and keywords as separate columns.
- Aggregate keywords into a single string for embedding.
- Use hybrid queries to combine semantic and keyword relevance.
- SQLite is convenient, portable, and powerful for agent knowledge bases.


## Minimal Chunk Size and Merging Strategy

To optimize retrieval and context management, set a minimal chunk size when splitting documents:

- **Define a minimum threshold** (e.g., 300–500 characters or 50–100 tokens) for chunk size.
- **Merge adjacent small sections** during chunking until the minimum size is reached.
- **Split only at logical boundaries** (such as headings) to preserve meaning and context.

This prevents excessive fragmentation, ensures each chunk is contextually useful, and improves both storage and agent retrieval efficiency.
