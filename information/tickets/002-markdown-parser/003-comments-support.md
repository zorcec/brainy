## Title
Comments Support ("<!-- ... -->")

## Problem
Markdown playbooks often include inline comments for documentation, context, or agent instructions. The parser must reliably detect and extract these comments to support downstream processing and maintain self-explanatory playbooks.

## Solution
Extend the parser to detect comment blocks (<!-- ... -->) and output them as `plainComment` objects, capturing the comment text in the `content` field. The parser returns a ParseResult `{ blocks, errors }`. Comments are treated as standalone blocks and do not affect annotation or code block parsing. If any parsing `errors` are returned, the playbook will not be executed.

## Proposal
1. Add regex logic to detect comment blocks (<!-- ... -->) in markdown. Ensure comment detection is skipped when inside a fenced code block.
2. Extract comment text and output as `{ name: 'plainComment', flags: [], content: '...' }`.
3. Integrate comment detection into the main parsing function.
4. Add unit tests for single-line and multi-line comments.

## Acceptance Criteria
- The parser returns a ParseResult `{ blocks, errors }`.
- Comments are detected and extracted as `plainComment` objects.
- Comment text is captured (trimmed) in the `content` field.
- Comment detection does not run inside fenced code blocks.
- Unit tests (Vitest) cover single-line and multi-line comments and are placed next to `comment.ts`.
- If `errors` is non-empty the playbook will not be executed.
- All tests must run successfully before marking this story as done.

## Tasks/Subtasks
- Implement regex for comment detection.
- Update parser to output `plainComment` objects.
- Write unit tests for comment cases.
- Agent should think about additional use cases and cover them with unit tests; the provided edge-cases are just help but not complete.
- Document comment support in the module.

## Open Questions
- Should comments inside code blocks be ignored?
 - Yes, comments within code blocks should not be parsed as standalone comments.
- Should comments be stripped of leading/trailing whitespace?
 - Yes, leading/trailing whitespace should be trimmed from comment content.

## Additional Info
- Risks: Unusual comment formats may require regex updates.
- Reviewer should check for correct extraction and no interference with other block types.

## Examples
### Example 1: Single-line comment
Input:
```
<!-- This is a comment -->
```
Expected Output:
[
  { name: 'plainComment', flags: [], content: 'This is a comment' }
]

### Example 2: Multi-line comment
Input:
```
<!--
Multi-line
comment
-->
```
Expected Output:
[
  { name: 'plainComment', flags: [], content: 'Multi-line\ncomment' }
]
