## Title
Documentation

## Problem
Without clear, concise, and complete documentation, the parser module and its API will be difficult to use, maintain, and extend. Developers and users need reliable references for functions, types, usage, and edge cases.

## Solution
Document all public functions, types, and usage examples directly inside the module files using JSDoc and explanatory comments. Additionally, maintain a short and concise README.md file in the module root that covers module purpose and architecture. The documentation must include the parser's API contract: the parser returns a `ParseResult` of the form `{ blocks: AnnotationBlock[]; errors: ParserError[] }`. The docs should clearly state that if `errors` is non-empty the playbook will not be executed.

## Proposal
1. Add JSDoc comments and explanations for all exported functions and types inside each module file.
2. Include usage examples and edge case notes in the module files where relevant.
3. Create and maintain a README.md in the module root with:
  - Module overview and purpose
  - API contract (ParseResult, AnnotationBlock, ParserError)
  - References to related stories and guidelines
  - How to run unit tests (Vitest) and benchmark scripts
  - README must include direct links to the module files and tests and a one-line comment reminding maintainers to update docs on changes.

## Acceptance Criteria
- All public functions and types are documented with JSDoc and explanatory comments inside module files. Types must include `ParseResult`, `AnnotationBlock`, and `ParserError`.
- README.md in the module root provides the API contract, usage examples, links to module files and tests, and instructions to run Vitest.
- Documentation explicitly states that any non-empty `errors` prevents playbook execution.
 - Consistency rule: if `errors` is non-empty those errors are authoritative and any `blocks` returned must be ignored by the consumer; the playbook will not execute.
- Documentation is updated with every significant code change or feature addition.
- All tests (Vitest) must run successfully before marking this story as done.

## Tasks/Subtasks
- Write JSDoc and explanatory comments for all exported functions and types in module files.
- Add usage and edge case examples to module files.
- Create and maintain README.md in the module root with all required sections.
- Update documentation with every code or feature change.
- Review documentation for clarity and completeness.

## Open Questions
- Should internal/private functions be documented, or only public API?
  - Just public API is sufficient, but only in the code.
- How should deprecated features or breaking changes be documented?
    - Use JSDoc `@deprecated` tags, only in the code.

## Additional Info
- Risks: Outdated documentation may cause confusion or errors.
- Reviewer should check for clarity, completeness, and alignment with guidelines.

## Example
### Example: JSDoc in module file
```typescript
/**
 * Parses markdown and returns an array of annotation blocks.
 * @param markdown - The markdown string to parse
 * @returns Array of AnnotationBlock objects
 */
export function parseAnnotations(markdown: string): AnnotationBlock[] {
  // ...implementation...
}
```

### Example: README.md section
```
# Parser Module

## Overview
Parses markdown files to extract annotation blocks, flags, code blocks, and comments. Handles edge cases and error reporting.

## Usage
```typescript
import { parseAnnotations } from './parser';
const result = parseAnnotations(markdown);
```
```
