# Brainy Markdown Parser

A modular, function-based, regex-powered parser for extracting annotations, flags, comments, and text from Brainy markdown playbooks.

> **⚠️ Maintainer Note**: When making changes to this module, always update this README and the JSDoc comments in the relevant module files.

## Overview

The Brainy parser extracts structured data from markdown files containing agent workflow instructions. It follows a clean, modular architecture with separate modules for different concerns.

The parser is used both for **playbook execution** (to extract annotation blocks for the agent) and for **editor highlighting** (to provide syntax highlighting in VS Code).

## Integration Points

### Playbook Execution
The parser is the core component for extracting structured workflow instructions from markdown files. The main entry point `parseAnnotations()` returns blocks and errors that are used by the playbook executor.

### Editor Highlighting
The parser is integrated with the VS Code extension to provide real-time syntax highlighting for annotations, flags, and errors in markdown files. See [Markdown Annotation Highlighting](../markdown/README.md) for details on the highlighting implementation.

## API Contract

The parser exposes a single primary function `parseAnnotations()` that returns a `ParseResult`:

```typescript
type ParseResult = {
  blocks: AnnotationBlock[];
  errors: ParserError[];
};
```

**Critical Consistency Rule**: If the `errors` array is non-empty, **the playbook will not be executed**, regardless of what blocks were successfully parsed. Any non-empty `errors` array is authoritative, and any returned `blocks` must be ignored by the consumer.

This ensures that only fully valid playbooks are executed, preventing partial or corrupted execution.

### Module Structure

```
parser/
├── index.ts                    # Main entry point, exports parseAnnotations
├── regex.ts                    # Centralized regex patterns
├── errors.ts                   # Error handling utilities
├── errors.test.ts              # Error utilities tests (4 tests)
├── utils.ts                    # Shared utility functions
├── utils.test.ts               # Utility tests (9 tests)
├── blocks/                     # Block extraction modules
│   ├── annotation.ts           # Annotation extraction logic
│   ├── annotation.test.ts      # Annotation tests (11 tests)
│   ├── codeBlock.ts            # Code block extraction logic
│   ├── codeBlock.test.ts       # Code block tests (20 tests)
│   ├── flag.ts                 # Flag parsing logic
│   ├── flag.test.ts            # Flag tests (20 tests)
│   ├── comment.ts              # Comment extraction (single & multi-line)
│   ├── comment.test.ts         # Comment tests (23 tests)
│   ├── plainText.ts            # Plain text blocks
│   └── plainText.test.ts       # Plain text tests (6 tests)
├── index.test.ts               # Integration tests (44 tests)
├── edgeCases.test.ts           # Edge case & error handling tests (35 tests)
├── performance.test.ts         # Performance benchmarks (11 tests)
├── examples.ts                 # Usage examples
└── README.md                   # This file
```

**Quick Links to Module Files**:
- [index.ts](./index.ts) - Main parser entry point
- [errors.ts](./errors.ts) - Error types and utilities
- [regex.ts](./regex.ts) - Regex patterns
- [utils.ts](./utils.ts) - Utility functions
- [blocks/annotation.ts](./blocks/annotation.ts) - Annotation parsing
- [blocks/flag.ts](./blocks/flag.ts) - Flag parsing
- [blocks/codeBlock.ts](./blocks/codeBlock.ts) - Code block parsing
- [blocks/comment.ts](./blocks/comment.ts) - Comment parsing
- [blocks/plainText.ts](./blocks/plainText.ts) - Plain text blocks

**Test Files**:
- [index.test.ts](./index.test.ts) - Integration tests
- [edgeCases.test.ts](./edgeCases.test.ts) - Edge cases
- [performance.test.ts](./performance.test.ts) - Performance benchmarks
- [errors.test.ts](./errors.test.ts) - Error handling tests
- [utils.test.ts](./utils.test.ts) - Utility tests

### Supported Features

- **Annotations**: `@annotation_name` with optional flags
- **Flags**: `--flag_name "value"` format (single or multi-line)
- **Direct Values**: `"value1" "value2"` without flag names
- **Comments**: `<!-- comment -->` (single-line and multi-line)
- **Plain Text**: Any text between annotations
- **Code Blocks**: Triple-backtick fenced code with optional language metadata

## Installation

```typescript
import { parseAnnotations } from './parser';
```

## Usage

### Basic Example

```typescript
const markdown = `
@model "gpt-4.1"
@task --prompt "Summarize the topic" --variable "result"
Some plain text here.
<!-- A comment -->
`;

const result = parseAnnotations(markdown);

// Access blocks
result.blocks.forEach((block) => {
  console.log(`Block: ${block.name}`);
  console.log(`Flags:`, block.flags);
  console.log(`Content: ${block.content}`);
});

// Check for errors
if (result.errors.length > 0) {
  console.error('Parsing errors:', result.errors);
}
```

## API

### `parseAnnotations(markdown: string): ParseResult`

Parses markdown and returns structured blocks and errors.

**Parameters:**
- `markdown` (string): The markdown content to parse

**Returns:** `ParseResult`
- `blocks` (AnnotationBlock[]): Array of parsed blocks
- `errors` (ParserError[]): Array of parsing errors

**Critical Rule**: If `errors` is non-empty, the playbook will not execute. Always check the errors array before processing blocks. The consistency rule dictates that any non-empty `errors` array is authoritative, and consumers must ignore the `blocks` array in this case.

**Example Usage:**
```typescript
import { parseAnnotations } from './parser';

const result = parseAnnotations(markdown);

if (result.errors.length > 0) {
  // Handle errors - playbook won't execute
  console.error('Cannot execute playbook due to errors:', result.errors);
  return;
}

// Safe to process blocks - no errors
result.blocks.forEach(block => {
  // ... process block
});
```

## Types

### ParseResult

The primary return type from `parseAnnotations()`.

```typescript
type ParseResult = {
  blocks: AnnotationBlock[];  // Array of parsed blocks
  errors: ParserError[];      // Array of parsing errors
};
```

**Contract**: If `errors.length > 0`, the playbook will not execute. Consumers must check the errors array before processing blocks.

### AnnotationBlock

Represents a parsed block from markdown.

```typescript
export type AnnotationBlock = {
  name: string;           // Block type or annotation name (e.g., 'task', 'plainText', 'plainComment')
  flags: Flag[];          // Array of flags associated with this block
  content: string;        // Original markdown content
  line?: number;          // Optional line number (1-indexed)
  metadata?: {            // Optional metadata
    language?: string;    // Language for code blocks (e.g., 'bash', 'python')
  };
};
```

**Defined in**: [blocks/plainText.ts](./blocks/plainText.ts)

### Flag

Represents a flag with name and value(s).

```typescript
type Flag = {
  name: string;           // Flag name (empty string for direct values)
  value: string[];        // Array of values (always an array, even for single values)
};
```

**Defined in**: [blocks/flag.ts](./blocks/flag.ts)

### ParserError

Represents errors encountered during parsing.

```typescript
type ParserError = {
  type: string;           // Error type identifier (e.g., 'UnclosedCodeBlock', 'INVALID_ANNOTATION')
  message: string;        // Human-readable error description
  line?: number;          // Line number where error occurred (1-indexed)
  severity?: 'critical' | 'warning' | 'info';  // Error severity
  context?: string;       // Additional context (e.g., the problematic line content)
};
```

**Defined in**: [errors.ts](./errors.ts)

## Supported Patterns

### Single-Line Annotations

```markdown
@task --prompt "Do something" --variable "result"
```

Parsed as:
```typescript
{
  name: 'task',
  flags: [
    { name: 'prompt', value: ['Do something'] },
    { name: 'variable', value: ['result'] }
  ],
  content: '@task --prompt "Do something" --variable "result"',
  line: 1
}
```

### Multi-Line Annotations

```markdown
@task
   --prompt "Do something"
   --variable "result"
```

Flags must be on following lines beneath the annotation header. Parsing stops at empty lines or next annotation.

### Direct Values (No Flag Name)

```markdown
@context "main" "research"
@model "gpt-4.1"
```

Parsed as flags with empty name:
```typescript
{
  name: 'context',
  flags: [{ name: '', value: ['main', 'research'] }],
  content: '@context "main" "research"',
  line: 1
}
```

### Comments

**Single-line comments:**
```markdown
<!-- This is a comment -->
```

Parsed as:
```typescript
{
  name: 'plainComment',
  flags: [],
  content: 'This is a comment',
  line: 1
}
```

**Multi-line comments:**
```markdown
<!--
Multi-line
comment
-->
```

Parsed as:
```typescript
{
  name: 'plainComment',
  flags: [],
  content: 'Multi-line\ncomment',
  line: 1
}
```

**Important:** Comments inside code blocks are NOT parsed as standalone comments. They are treated as part of the code block content.

### Plain Text

Any text that is not an annotation or comment is parsed as plain text:

```typescript
{
  name: 'plainText',
  flags: [],
  content: 'Some text here',
  line: 1
}
```

### Code Blocks

Code blocks are fenced with triple backticks and can include optional language metadata:

```markdown
@execute
\`\`\`bash
echo "Hello World"
\`\`\`
```

Parsed as:
```typescript
[
  {
    name: 'execute',
    flags: [],
    content: '@execute',
    line: 1
  },
  {
    name: 'plainCodeBlock',
    flags: [],
    content: 'echo "Hello World"',
    metadata: { language: 'bash' },
    line: 2
  }
]
```

**Code Block Features:**
- Language metadata is preserved exactly as written (no normalization)
- Empty code blocks are valid: `\`\`\`python\n\`\`\``
- Code blocks without language metadata have `language: undefined`
- All code blocks are parsed; execution logic decides which to run
- Unclosed code blocks result in critical parsing errors

**Example without language:**
```markdown
\`\`\`
echo "No language"
\`\`\`
```

Parsed as:
```typescript
{
  name: 'plainCodeBlock',
  content: 'echo "No language"',
  metadata: { language: undefined }
}
```

## Variable Substitution

The parser preserves variable substitution patterns without evaluation:

```markdown
@task --prompt "Use {{topic}} and ${variable}"
```

The values are stored as-is: `["Use {{topic}} and ${variable}"]`

## Edge Cases

### Empty Quoted Values

```markdown
@task --prompt ""
```

Returns: `{ name: 'prompt', value: [''] }`

### Flags Without Values

```markdown
@task --flag1
```

Returns: `{ name: 'flag1', value: [] }`

### Multiple Values

```markdown
@context "value1" "value2" "value3"
```

Returns: `{ name: '', value: ['value1', 'value2', 'value3'] }`

### Whitespace Preservation

Whitespace inside quoted values is preserved exactly:

```markdown
@task --prompt "  extra  spaces  "
```

Returns: `{ name: 'prompt', value: ['  extra  spaces  '] }`

## Error Handling

The parser is designed to handle malformed input gracefully and return structured error information. **Critical rule**: If the `errors` array is non-empty, the playbook will not execute, regardless of whether blocks were parsed.

**Consistency Rule**: When `errors.length > 0`, those errors are authoritative, and any `blocks` returned must be ignored by the consumer. The playbook will not be executed under any circumstances if errors are present.

### Error Types and Severity Levels

Errors are classified by severity:

- **critical**: Prevents parsing or execution (e.g., unclosed code block, invalid annotation syntax)
- **warning**: Non-critical issues that may indicate problems (future use)
- **info**: Informational messages (future use)

### Supported Error Types

#### 1. UnclosedCodeBlock (Critical)

Occurs when a code block is opened with ``` but never closed.

**Example:**
```markdown
@execute
```bash
echo "Hello World"
```

**Error:**
```typescript
{
  type: 'UnclosedCodeBlock',
  message: 'Unclosed code block detected.',
  line: 2,
  severity: 'critical'
}
```

**Behavior**: Parser stops processing the file and returns only the error. No blocks are returned for critical parsing errors.

#### 2. INVALID_ANNOTATION (Critical)

Occurs when an annotation has invalid syntax (e.g., `@` without a name).

**Example:**
```markdown
@
```

**Error:**
```typescript
{
  type: 'INVALID_ANNOTATION',
  message: 'Invalid annotation syntax: @',
  line: 1,
  severity: 'critical',
  context: '@'
}
```

**Behavior**: Error is reported, and the line is skipped. Other valid blocks continue to be parsed, but the playbook will not execute due to the error.

### Error Object Structure

```typescript
type ParserError = {
  type: string;           // Error type identifier (e.g., 'UnclosedCodeBlock')
  message: string;        // Human-readable error description
  line?: number;          // Line number where error occurred (1-indexed)
  severity?: 'critical' | 'warning' | 'info';  // Error severity
  context?: string;       // Additional context (e.g., the problematic line content)
};
```

### Handling Errors in Your Code

Always check for errors before processing blocks:

```typescript
const result = parseAnnotations(markdown);

if (result.errors.length > 0) {
  // Errors present - playbook will not execute
  console.error('Parsing failed with errors:');
  result.errors.forEach(error => {
    console.error(`[${error.severity}] ${error.type} at line ${error.line}: ${error.message}`);
  });
  return; // Stop processing
}

// No errors - safe to process blocks
result.blocks.forEach(block => {
  // Process block...
});
```

### Edge Cases Handled

The parser handles a wide range of edge cases gracefully:

#### Malformed Annotations

- **`@` alone**: Returns `INVALID_ANNOTATION` error
- **`@task!invalid`**: Parses as `@task` (only word characters captured)
- **`context "main"` (missing @)**: Treated as plain text

#### Malformed Flags

- **`--flag` (no value)**: Valid, returns `{ name: 'flag', value: [] }`
- **`--` alone**: Parsed but may have empty flag name
- **`@task --flag "unbalanced`: Regex doesn't match unbalanced quotes; flag may be empty

#### Code Block Edge Cases

- **Empty code block**: Valid, returns empty content
- **Nested backticks**: Treated as part of code content
- **Multiple consecutive unclosed blocks**: First error is reported
- **Code block with no language**: Valid, `language` is `undefined`

#### Comment Edge Cases

- **Unclosed HTML comment** (`<!-- text`): Treated as plain text
- **Nested comments**: HTML doesn't support them; parsed as single comment
- **Empty comments** (`<!-- -->`): Valid, content is empty string
- **Comments inside code blocks**: NOT parsed as standalone comments

#### Content Edge Cases

- **Unicode characters**: Non-ASCII annotation names don't match `\w` and are treated as plain text or errors
- **Excessive whitespace**: Trimmed and handled correctly
- **Empty file**: Returns empty blocks and errors arrays
- **Very large files**: Handles 10,000+ lines efficiently
- **Very long lines**: No hard limit, handled gracefully

### Edge Case Test Coverage

All edge cases are covered by comprehensive unit tests in `edgeCases.test.ts` (35 tests):

- Error handling for all story examples
- Malformed input (15 test cases)
- Flag combinations (5 test cases)
- Comment edge cases (3 test cases)
- Mixed content stress tests (4 test cases)
- Line number tracking (2 test cases)
- Performance and limits (2 test cases)

### Non-Standard Markdown Features

The parser is designed for Brainy-specific markdown extensions. Standard markdown features not explicitly supported include:

- Indented code blocks (use fenced code blocks with ```)
- HTML-style comments as standalone comments (use `<!-- -->`)
- Custom annotation syntax beyond `@annotation_name`

These are parsed as plain text.

### Error Recovery Strategy

The parser uses an error recovery strategy:

1. **Critical errors** (e.g., unclosed code block): Stop parsing, return error only
2. **Non-critical errors** (e.g., invalid annotation): Report error, continue parsing other blocks
3. **Consistency rule**: If any errors are returned, the playbook will not execute, even if some blocks were successfully parsed

This ensures that playbooks are only executed when fully valid.

### Example: Mixed Content with Errors

```markdown
@execute
```bash
echo "Test"
<!-- Missing closing for code block -->
@task --prompt "Valid annotation"
```

**Result:**
```typescript
{
  blocks: [],  // No blocks returned for critical errors
  errors: [
    {
      type: 'UnclosedCodeBlock',
      message: 'Unclosed code block detected.',
      line: 2,
      severity: 'critical'
    }
  ]
}
```

**Outcome**: Playbook will not execute due to the critical error.



## Design Principles

1. **Modular**: Separate files for different concerns (flags, comments, annotations)
2. **Generic**: No hardcoded annotation names or types
3. **Pure Functions**: No side effects, testable
4. **Regex-Based**: Fast and simple pattern matching
5. **Error-First**: Returns errors instead of throwing
6. **Type-Safe**: Full TypeScript type definitions
7. **Co-located Tests**: Test files next to implementation files

## Module Descriptions

### Core Modules

- **index.ts**: Main parser orchestration, exports `parseAnnotations()`
- **regex.ts**: Centralized regex patterns for all parsing operations
- **errors.ts**: Error creation and handling utilities
- **utils.ts**: Shared utility functions (line checking, trimming, etc.)

### Block Extraction Modules

- **blocks/annotation.ts**: Parses annotation blocks (@task, @context, etc.)
- **blocks/codeBlock.ts**: Extracts code blocks with language metadata
- **blocks/flag.ts**: Extracts and validates flags (--flag "value")
- **blocks/comment.ts**: HTML comment extraction (<!-- -->)
- **blocks/plainText.ts**: Plain text and comment block creation

## Performance

The parser has been extensively benchmarked to ensure it meets production performance requirements. All benchmarks are automated and run as part of the test suite.

### Performance Benchmarks

**Run benchmarks:** `npm test -- performance.test.ts`

#### Primary Requirements (from Story 007)

- **10,000 lines**: < 500ms, < 50MB memory
- **Status**: ✅ **EXCEEDED** (72x faster than required)

#### Benchmark Results

| File Size | Duration | Memory | Status |
|-----------|----------|--------|--------|
| 1,000 lines | 1.60ms | 0.35MB | ✅ Excellent |
| 5,000 lines | 2.15ms | 1.44MB | ✅ Excellent |
| **10,000 lines** | **6.91ms** | **2.99MB** | ✅ **PRIMARY THRESHOLD** |
| 20,000 lines | 8.86ms | 5.25MB | ✅ Stress test passed |

#### Error Handling Performance

| Scenario | Duration | Memory | Status |
|----------|----------|--------|--------|
| Malformed input (1k) | 0.19ms | 0.06MB | ✅ Fast error detection |
| Malformed input (5k) | 0.35ms | 0.36MB | ✅ Efficient error handling |

*Note: When errors are present, the consistency rule applies—blocks are ignored and the playbook will not execute.*

#### Edge Case Performance

| Test Case | Duration | Status |
|-----------|----------|--------|
| 100 lines × 10k chars each | 1.22ms | ✅ Handles very long lines |
| 5,000 small annotations | 6.51ms | ✅ Efficient annotation parsing |
| 1,000 code blocks (3k lines) | 0.82ms | ✅ Fast code block extraction |
| Memory stability (10 parses) | -4.80MB | ✅ No memory leaks |

#### Performance Characteristics

- **Time Complexity**: O(n) linear with number of lines
- **Memory Usage**: O(n) linear with file size, minimal overhead
- **Scalability**: Tested up to 20,000 lines with excellent performance
- **Stability**: Memory usage remains stable across multiple parses

#### Test Environment

- **Node.js**: v22.19.0
- **Platform**: Linux x64
- **Benchmark Suite**: 11 automated performance tests
- **Location**: `src/parser/performance.test.ts`

#### Performance Notes

1. **Well-Formed Input**: Parser is highly optimized for valid markdown, processing 10k lines in ~7ms
2. **Malformed Input**: Error detection is fast (<1ms for 1k lines), ensuring quick feedback
3. **Memory Efficiency**: Uses <3MB for 10k lines, well under the 50MB threshold
4. **No Bottlenecks**: Linear scaling confirmed across all test sizes

The parser **significantly exceeds** all performance requirements, providing a robust foundation for large-scale markdown processing.

## Testing

Run the test suite with Vitest:

```bash
# From the vscode-extension directory
npm test

# Or with watch mode
npm test -- --watch

# Run specific test file
npm test -- parser/index.test.ts

# Run with coverage
npm test -- --coverage
```

### Test Coverage

**Total: 187 tests, all passing**

| Module | Tests | Coverage |
|--------|-------|----------|
| Integration (index.test.ts) | 44 | Core workflows, code blocks & comments |
| Edge cases (edgeCases.test.ts) | 35 | Error handling, malformed input, stress tests |
| **Performance (performance.test.ts)** | **11** | **Benchmarks & thresholds** |
| Code block extraction | 20 | All code block patterns |
| Flag extraction | 20 | All flag patterns |
| Comment extraction | 23 | Single & multi-line comments |
| Annotation parsing | 11 | Single/multi-line |
| Utilities | 9 | Helper functions |
| Plain text blocks | 6 | Text & comments |
| Error handling | 4 | Error creation |

### Test Organization

- **Unit tests**: Co-located with implementation (e.g., `flag.test.ts` next to `flag.ts`)
- **Integration tests**: `index.test.ts` tests complete parsing workflows
- **Coverage**: All edge cases, Unicode, special characters, error conditions

## Limitations

1. **Escaped Quotes**: Not currently supported in quoted values
2. **Nested Structures**: Flat parsing only, no nested annotations

## Future Enhancements

- Support for escaped quotes in values
- Link resolution and file inclusion
- Context chaining and combination logic
- Performance optimizations for very large files

## Contributing

When adding new annotation types or flag formats:

1. Add test cases to the appropriate test file (e.g., `flag.test.ts` for flag changes)
2. Update the relevant module (keep changes focused and modular)
3. Ensure all existing tests pass
4. Add integration tests to `index.test.ts` for complex workflows
5. Document new patterns in this README
6. Maintain backward compatibility

### Adding New Block Types

To add a new block type:

1. Create `blocks/newType.ts` with extraction logic
2. Create `blocks/newType.test.ts` with comprehensive tests
3. Update `index.ts` to call the new extraction logic
4. Add integration tests to verify end-to-end behavior
5. Update README with examples and patterns

## License

Part of the Brainy project.
