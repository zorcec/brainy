## Title
Error Handling & Edge Case Coverage

## Problem
Markdown playbooks may contain malformed annotations, code blocks, flags, or comments. Without robust error handling and edge case coverage, the parser may fail silently, produce incorrect output, or miss critical issues, reducing reliability and maintainability.

## Solution
Implement comprehensive error handling in the parser. The parser returns a ParseResult `{ blocks, errors }`. Doesn't matter which internal strategy is used — do what is easier. If any errors are returned the playbook will not be executed; for critical parsing errors (e.g., unclosed code fence) the parser should return only `errors` (no `blocks`). Validate input, detect malformed or ambiguous blocks, and return error objects with clear messages, line number, block context, and severity. Ensure tests cover edge cases and errors.

Consistency rule: if `errors` is non-empty those errors are authoritative and any `blocks` returned must be ignored by the consumer; the playbook will not execute.

## Proposal
1. Add validation logic for annotations, flags, code blocks, and comments.
2. Detect and collect errors (e.g., unclosed code blocks, flags without quoted values, malformed annotations, ambiguous or overlapping blocks).
3. Return error objects in a dedicated `errors` array alongside parsed blocks, including type, message, line number, block context, and severity. If `errors` is non-empty the playbook will not be executed. For critical parsing errors, return only the `errors` array and set severity to `critical`.
4. Fail parsing and return only `errors` for critical issues (e.g., unclosed code block); collect and report non-critical errors alongside parsed `blocks`. Note: even non-critical errors prevent playbook execution by project policy.
5. Non-standard markdown features (e.g., indented code blocks, HTML-style comments, custom annotation syntax) are parsed as "plainText".
6. Require comprehensive unit test coverage for all block types, combinations, and malformed input patterns; specify a minimum coverage checklist.
7. Clarify error reporting format: errors should be returned as a separate array containing line number.
8. Document all error handling logic and edge case coverage in the module for maintainability.

## Acceptance Criteria
- All malformed, ambiguous, or overlapping blocks are detected and reported as error objects with type, message, line number, block context, and severity.
- Errors are returned in a dedicated array.
- Critical parsing errors cause the parser to fail and return errors only; non-critical errors are collected and returned with parsed blocks.
- Non-standard markdown features are handled as documented.
- Unit tests cover all documented and additional edge cases, meeting the coverage checklist.
- Error handling logic and edge case coverage are documented in the module.
- All tests must run successfully before marking this story as done.

## Tasks/Subtasks
- Implement validation logic for all block types, including ambiguous/overlapping blocks.
- Expand error object structure to include line number, block context, and severity.
- Add error collection and reporting to the parser output, supporting both array and block-linked formats.
- Write unit tests for error scenarios and edge cases, meeting the coverage checklist.
- Document error handling and edge case coverage in the module.
- Agent should think about additional use cases and cover them with unit tests; the provided edge-cases are just help but not complete.

## Open Questions
- Should the parser stop at the first critical error or continue collecting all errors? (Recommended: collect all errors unless a critical failure prevents further parsing.)
- How should ambiguous blocks (e.g., overlapping annotation and code block) be handled? (Recommended: treat as error and report with context.)

## Additional Info
- Risks: Unusual or rare edge cases may require future updates.
- Reviewer should check for comprehensive error coverage, clear error messages, and documentation.

## Examples
### Example 1: Unclosed code block
Input:
```
@execute
``` bash
Hello World
```
Expected Output:
[]
Errors:
[
  { type: 'ParseError', message: 'Unclosed code block detected.', line: 2, block: 'code', severity: 'critical' }
]

### Example 2: Flag value not in quotes
Input:
```
@flag value
```
Expected Output:
[
  { name: 'flag', flags: [], content: '@flag value' }
]
Errors:
[
  { type: 'FlagSyntaxError', message: 'Flag value not in double quotes.', line: 1, block: 'flag', severity: 'warning' }
]

### Example 3: Malformed annotation
Input:
```
context "main"
```
Expected Output:
[
  { name: 'plainComment', flags: [], content: 'context "main"' }
]

### Example 4: Overlapping annotation and code block (ambiguous)
Input:
```
@execute
@context "main"
``` bash
Hello World
```
Expected Output:
[
  { name: 'execute', flags: [], content: '@execute' },
  { name: 'context', flags: [ { name: '', value: ['main'] } ], content: '@context "main"' },
  { name: 'codeBlock', flags: [], content: ' bash\nHello World\n', metadata: { language: 'bash' } },
]