# Example: Keyword Search

Keyword search uses traditional text matching to find exact or fuzzy matches.

## Techniques

### Full-Text Search (FTS)
- Index all words in documents
- Fast lookup by keyword
- Boolean operators (AND, OR, NOT)

### SQLite FTS5
```sql
CREATE VIRTUAL TABLE documents USING fts5(content);
INSERT INTO documents VALUES ('Hello world');
SELECT * FROM documents WHERE documents MATCH 'hello';
```

## Benefits

- Fast and efficient
- Precise matching
- Works well for known terms

## Use Cases

- Finding specific function names
- Locating error messages
- Searching for exact phrases
