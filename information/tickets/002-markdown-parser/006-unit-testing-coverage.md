## Title
Unit Testing - Coverage for All Patterns & Edge Cases

## Problem
Without comprehensive unit tests, the parser may fail to handle all annotation patterns, flags, code blocks, comments, and malformed input. This risks undetected bugs, regressions, and unreliable agent workflows.

## Solution
Write and maintain unit tests (Vitest) for every supported annotation pattern, flag format, code block, comment, and error scenario. Organize tests next to their corresponding module files. Ensure coverage for all documented and newly discovered edge cases, and update tests as the parser evolves. Tests must validate the full `ParseResult` shape (`blocks` and `errors`) and confirm that returned errors would block playbook execution.

## Proposal
1. Create unit test files next to each module file (e.g., `annotation.test.ts`, `flag.test.ts`).
2. Write tests for:
   - All annotation types and flag formats
   - Code blocks (single, multi-line, with/without language)
   - Comments (single-line, multi-line)
   - Plain text blocks
   - Error scenarios (malformed input, ambiguous blocks, unclosed code blocks, invalid flags)
   - Edge cases and combinations
3. Use clear input/output examples and assert both parsed blocks and error objects.
4. Update tests with every code or feature change.
5. Review coverage regularly and add tests for new patterns or edge cases.

## Acceptance Criteria
- Unit tests (Vitest) exist for all annotation, flag, code block, comment, and error scenarios and validate the `ParseResult` shape.
- Edge cases and combinations are covered.
- Tests are placed next to their module files.
- Tests are updated with every code or feature change.
- Coverage is reviewed and maintained as the parser evolves.
- All tests must run successfully before marking this story as done.
 - Consistency rule: if `errors` is non-empty those errors are authoritative and any `blocks` returned must be ignored by the consumer; the playbook will not execute.

## Tasks/Subtasks
- Write unit tests for annotation, flag, code block, comment, and error handling modules.
- Add tests for all documented and newly discovered edge cases.
- Assert both parsed output and error objects.
- Update tests with every code or feature change.
- Review and maintain coverage.

## Open Questions
- Should integration tests be added for full markdown parsing workflows?
- How should coverage be measured and enforced?

## Additional Info
- Risks: Missing edge cases may cause undetected bugs.
- Reviewer should check for coverage, clarity, and alignment with guidelines.

## Example
### Example: Code block and error scenario
```typescript
test('parses code block and detects unclosed block', () => {
  const md = '@execute\n```bash\necho "Hello"';
  const result = parseAnnotations(md);
  expect(result.blocks).toEqual([
    { name: 'execute', flags: [], content: '@execute' }
  ]);
  expect(result.errors).toEqual([
    { type: 'ParseError', message: 'Unclosed code block detected.', line: 2, block: 'code', severity: 'critical' }
  ]);
});
```
