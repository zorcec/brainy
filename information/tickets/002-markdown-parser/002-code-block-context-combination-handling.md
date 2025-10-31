## Title
Code Block & Context Combination Handling

## Problem
Brainy playbooks use embedded code blocks (e.g., Bash, Python) and context combination annotations (e.g., `@context "main" "research"`) to define agent workflows. The parser must reliably extract code blocks and handle context combination to enable deterministic execution and context chaining.

## Solution
## Explicit Parser Behaviors & Edge Cases
### 8. Flag Handling
- If no flags are present, return an empty array for flags.
- If a flag is provided without a value, return the flag with an empty value array (e.g., `{ name: 'flag', value: [] }`).
- If a flag is provided and the value is not inside double quotes, treat this as a syntax error, collect the error, and return it from the parser.

### 1. Annotation Detection
- If a line does not start with `@`, it is treated as plain text and captured as a `plainComment` object.

### 2. Code Block Handling
- All code blocks are parsed and represented as `plainCodeBlock` objects, regardless of their position. Later logic will ensure only the first code block after an annotation is executed.

### 3. Language Metadata
- Language metadata is captured as-is from the code block fence (e.g., ``` python). No normalization or validation is performed at this stage.

### 4. Flags Array Consistency
- If a context annotation has no quoted values, skip this flag, treat it as an error, and collect errors to return from the parser.

### 5. Standalone Code Blocks
- Code blocks not preceded by an annotation are captured as `plainCodeBlock` objects.

### 6. Error Reporting
- If parsing fails due to malformed input (e.g., unclosed backticks, unclosed quotes), the parser should fail and return the error. Error collection is preferred for flags, but for critical parsing errors, fail and return the error.

### 7. Malformed Annotations
- Malformed annotations (missing `@`, unclosed quotes) are treated as plain text or error, as appropriate. Errors are collected and returned.
Extend the parser to detect and extract code blocks under `@execute` and similar annotations. The parser should return a ParseResult: `{ blocks: AnnotationBlock[]; errors: ParserError[] }`.

Key behavior clarifications:
- Code block `metadata.language` must be preserved exactly as written (no normalization).
- Multi-line annotations exist only in the format where flags are split onto subsequent lines beneath the annotation header; the parser must support that specific form.
- If the parser returns any errors (non-empty `errors` array), the playbook will not be executed. For critical parsing errors (e.g., unclosed code fence), the parser should return only `errors` with severity `critical`.

Code blocks must be represented as objects with `name: 'plainCodeBlock'`, a `content` property for the code, and a `metadata` property containing the language (if specified). Parse context combination annotations to capture all context names as flag values. Output a unified object for each block, consistent with the core parser story and the new code block structure.

## Proposal
1. Use regex to detect `@execute` and extract the following code block (triple backticks). Annotation names must be preserved exactly as written in the markdown; language metadata is captured verbatim.
2. Parse code block content and represent it as an object with `name: 'plainCodeBlock'`, `content`, and `metadata: { language }` (if language is specified after the triple backticks).
3. For context combination, parse all quoted context names and store as flag values in the output object.
4. Ensure output structure matches the core parser (name, flags, content) and uses the new code block format.
5. Add unit tests for code block extraction and context combination cases, including language metadata.

## Acceptance Criteria
- The parser returns a ParseResult `{ blocks, errors }`.
- Consistency rule: if `errors` is non-empty those errors are authoritative and any `blocks` returned should be ignored by the consumer; the playbook will not execute.
- Code blocks under `@execute` and similar annotations are detected and extracted as objects with `name: 'plainCodeBlock'`, `content`, and `metadata: { language }` (if language is specified).
- Context combination annotations are parsed with all context names as flag values.
- Output objects match the unified structure (name, flags, content) and use the new code block format. 
- If `errors` is non-empty the playbook will not be executed. Critical parsing errors should return only `errors` with `severity: 'critical'`.
- All tests must run successfully before marking this story as done.

## Tasks/Subtasks
- Implement regex for code block detection and extraction, supporting language metadata.
- Ensure the parser’s main function can handle multi-line blocks (for code blocks).
- Parse context combination flags and values.
- Update output object construction to use `plainCodeBlock` objects with `metadata`.
- Write and run unit tests for new cases, including language metadata.
- Agent should think about additional use cases and cover them with unit tests; the provided edge-cases are just help but not complete.
- Document new logic and edge cases, especially around code block language extraction.

## Open Questions
- How to handle nested or multi-language code blocks? (Current approach: all code blocks are parsed; later logic decides execution.)
- Should code block content be stored in a separate property or within `content`? (Current approach: use `content` for code, `metadata` for language.)

## Additional Info
- Risks: Unusual code block formats or context syntax may require parser updates.
- Reviewer should check for consistency with the core parser output and test coverage.

## Example
Input markdown:
```markdown
@execute
``` bash
echo "Hello World"
```
@context "main" "research"
```

Expected output (ParseResult):
```typescript
{
  blocks: [
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
    },
    {
      name: 'context',
      flags: [ { name: '', value: ['main', 'research'] } ],
      content: '@context "main" "research"',
      line: 5
    }
  ],
  errors: []
}
```

## Unit Test Examples
### Test 11: Annotation with no flags
Input:
```markdown
@execute
```
Expected Output:
[
  { name: 'execute', flags: [], content: '@execute' }
]

### Test 12: Flag with no value
Input:
```markdown
@flag
```
Expected Output:
[
  { name: 'flag', flags: [ { name: 'flag', value: [] } ], content: '@flag' }
]

### Test 13: Flag with value not in quotes (syntax error)
Input:
```markdown
@flag value
```
Expected Output:
[
  { name: 'flag', flags: [], content: '@flag value' }
]
Errors:
[
  { type: 'FlagSyntaxError', message: 'Flag value not in double quotes.' }
]
### Test 6: Plain text (no annotation)
Input:
```
This is a plain text line.
```
Expected Output:
[
  { name: 'plainComment', flags: [], content: 'This is a plain text line.' }
]

### Test 7: Multiple code blocks after annotation
Input:
```markdown
@execute
``` bash
echo "First"
```
``` python
print("Second")
```
```
Expected Output:
[
  { name: 'execute', flags: [], content: '@execute' },
  { name: 'plainCodeBlock', flags: [], content: 'echo "First"', metadata: { language: 'bash' } },
  { name: 'plainCodeBlock', flags: [], content: 'print("Second")', metadata: { language: 'python' } }
]

### Test 8: Context annotation with no quoted values (error)
Input:
```markdown
@context
```
Expected Output:
[
  { name: 'context', flags: [], content: '@context' }
]

### Test 9: Malformed annotation (missing @)
Input:
```
context "main"
```
Expected Output:
[
  { name: 'plainComment', flags: [], content: 'context "main"' }
]

### Test 10: Unclosed code block (critical error)
Input:
```markdown
@execute
``` bash
echo "Hello World"
```
Expected Output:
[]
Errors:
[
  { type: 'ParseError', message: 'Unclosed code block detected.' }
]

### Test 1: Basic code block and context combination
Input:
```markdown
@execute
``` bash
echo "Hello World"
```
@context "main" "research"
```
Expected Output:
[
  { name: 'execute', flags: [], content: '@execute' },
  { name: 'plainCodeBlock', flags: [], content: 'echo "Hello World"', metadata: { language: 'bash' } },
  { name: 'context', flags: [ { name: '', value: ['main', 'research'] } ], content: '@context "main" "research"' }
]

### Test 2: Code block with no language
Input:
```markdown
@execute
```
echo "No language"
```
```
Expected Output:
[
  { name: 'execute', flags: [], content: '@execute' },
  { name: 'plainCodeBlock', flags: [], content: 'echo "No language"', metadata: { language: undefined } }
]

### Test 3: Context with single value (skip if exists already)
Input:
```markdown
@context "main"
```
Expected Output:
[
  { name: 'context', flags: [ { name: '', value: ['main'] } ], content: '@context "main"' }
]

### Test 4: Edge case - empty code block
Input:
```markdown
@execute
``` python
```
Expected Output:
``` TypeScript
[
  { name: 'execute', flags: [], content: '@execute' },
  { name: 'plainCodeBlock', flags: [], content: '', metadata: { language: 'python' } }
]
```

### Test 5: Edge case - annotation with no code block
Input:
```markdown
@execute
@context "main"
```
Expected Output:
``` TypeScript
[
  { name: 'execute', flags: [], content: '@execute' },
  { name: 'context', flags: [ { name: '', value: ['main'] } ], content: '@context "main"' }
]
```

### Test 6: Edge case - annotation with flag without value
Input:
```markdown
@test --variable
```
Expected Output:
``` TypeScript
[
  { name: 'test', flags: [ { name: 'variable', value: [] } ], content: '@test --variable' }
]
```
### Test 7: Edge case - annotation with flag with unquoted value (error)
Input:```markdown
@test --variable value
```
Expected Output:
``` TypeScript
[
  { name: 'test', flags: [], content: '@test --variable value' }
]
Errors:
``` TypeScript
[  { type: 'FlagSyntaxError', message: 'Flag value not in double quotes.' } ]
```

## Key Project References
- [Project Overview](../../project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

**Agent Instruction:**
Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
