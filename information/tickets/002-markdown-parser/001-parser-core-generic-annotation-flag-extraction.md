## Title
Parser Core - Generic Annotation & Flag Extraction

## Problem
Brainy playbooks use a variety of annotation types and flag patterns to define agent skills and workflows. A generic, regex-based parser is needed to extract all annotation blocks and flags from markdown files, supporting any current or future annotation type and flag format. Without this, agent flows cannot be reliably parsed, extended, or tested.

## Solution
Implement a function-based parser that uses regular expressions to detect and extract annotation blocks and flags from markdown. The parser must be generic, handling any annotation name and flag, and output a unified object structure for downstream processing. No annotation names or flag types are hardcoded; all are detected dynamically.

## Proposal
1. Design a function-based API (e.g., `parseAnnotations(markdown: string): AnnotationBlock[]`).
2. Use regex to detect annotation lines (e.g., lines starting with `@`).
3. Use regex to extract flags (e.g., lines starting with `--`, supporting quoted values and variable substitution).
4. Build a unified output structure for each block, including annotation name, flags.
5. Ensure extensibility: support any annotation name and flag, and allow future annotation types without code changes.
6. Document the module and API clearly for maintainability.

## Acceptance Criteria
- Function-based parser implemented and exported
- Correctly detects and extracts all annotation blocks and flags from sample markdown files
- Supports any annotation name and flag format
- Outputs unified object structure as specified in parser.md
- No hardcoded annotation names or flag types
- Module and API are documented
- All tests must run successfully before marking this story as done.

## Tasks/Subtasks
- Design TypeScript types for annotation blocks and flags
- Implement regex logic for annotation and flag extraction
- Build main parsing function and output structure
- Add support for quoted values and variable substitution in flags
- Write documentation for the module and API
- Test with sample markdown files covering all annotation patterns
- Agent should think about additional use cases and cover them with unit tests; the provided edge-cases are just help but not complete.

## Open Questions
- Are there edge cases in annotation or flag formats not covered by current examples?
- Should comments or metadata be included in the output structure by default?
  - Comments are parsed with the type comment.
  - Other metadata is ignored for now.

## Additional Info
- Risks: Regex may miss rare or malformed annotation patterns; future annotation types may require minor regex updates.
- Reviewer should check for generic handling and extensibility.

## Implementation location

Implement parser module at: `packages/vscode-extension/src/parser/`.

## Examples
### Detailed Output Example
Given the following markdown:
```markdown
@task --prompt "Summarize the topic" --variable "topic"
Some introductory text here.
@context "main" "research"
<!-- This is a comment about the context -->
@model "gpt-4.1"
```
## Solution
Implement a function-based parser that uses regular expressions to detect and extract annotation blocks and flags from markdown. The parser must be generic, handling any annotation name and flag, and output a unified ParseResult for downstream processing. No annotation names or flag types are hardcoded; all are detected dynamically.
The output from `parseAnnotations` would be:
```typescript
[
1. Design a function-based API (e.g., `parseAnnotations(markdown: string): ParseResult`).
	 - ParseResult: { blocks: AnnotationBlock[]; errors: ParserError[] }
	 - Note: If `errors` is non-empty, the playbook will not be executed. Parsers should prioritize returning meaningful error objects for critical failures.
	 - Consistency rule: if `errors` is non-empty those errors are authoritative and any `blocks` returned should be ignored by the consumer; the playbook will not execute.
		name: 'task',
		flags: [
3. Use regex to extract flags (e.g., lines starting with `--`, supporting quoted values and variable substitution). Support multi-line annotations only in the specific format where flags are split onto following lines beneath the annotation header (see examples below).
			{ name: 'variable', value: ['topic'] }
		],.
	},
	{
		name: 'plainText',
		flags: [],
		content: 'Some introductory text here.'
	},
	{
		name: 'context',
		flags: [ { name: '', value: ['main', 'research'] } ],
		content: '@context "main" "research"'
### Detailed Output Example
	{
		name: 'plainComment',
		name: 'task',
		name: 'context',
		name: 'model',
	{
		name: 'model',
		flags: [ { name: '', value: ['gpt-4.1'] } ],
		content: '@model "gpt-4.1"'
	}
	/** Original line content from the markdown */
```
	/** Optional line number where the block starts in the source markdown */
	line?: number;

### API Usage Example
/**
 * The ParseResult returned by the parser.
 */
type ParseResult = {
	blocks: AnnotationBlock[];
	errors: Array<{ type: string; message: string; line?: number; severity?: 'critical' | 'warning' | 'info'; context?: string }>;
};
```typescript
import { parseAnnotations } from './parser';

const markdown = `
@task --prompt "Summarize the topic" --variable "topic"
@context "main"
`;

const result = parseAnnotations(markdown);
console.log(result);
```

### Returned Type Example
```typescript
/**
 * Represents a parsed annotation, plain text, or comment block from markdown.
 */
type AnnotationBlock = {
	/** Block type or annotation name (always a string, e.g., 'task', 'context', 'model', 'plainText', 'plainComment') */
	name: string;
	/** Array of flags, each with a string name and array of string values (always array, even for single value) */
	flags: Array<{ name: string; value: string[] }>;
	/** Original line content from the markdown */
	content: string;
};
```

### Unit Test Example
```typescript
import { parseAnnotations } from './parser';

test('parses single-line annotation with flags', () => {
	const md = '@task --prompt "Test" --variable "foo"';
	const result = parseAnnotations(md);
	expect(result).toEqual([
		{
			name: 'task',
			flags: [
				{ name: 'prompt', value: ['Test'] },
				{ name: 'variable', value: ['foo'] }
			],
			content: '@task --prompt "Test" --variable "foo"'
		}
	]);
});

test('parses plain comment', () => {
	const md = '<!-- This is a comment -->';
	const result = parseAnnotations(md);
	expect(result).toEqual([
		{
			name: 'plainComment',
			flags: [],
			content: 'This is a comment'
		}
	]);
});
```

## Key Project References
- [Project Overview](../../project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

**Agent Instruction:**

Before starting any implementation, the agent must:
- Parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Check existing open source parsers that use regular expressions for annotation/block extraction (e.g., markdown parsers, config file parsers).
- Reason about best practices in regex-based parsing and incorporate proven approaches into the implementation.

## Suggested Module Structure

A recommended organization for the parser module:

- `parser/`
  - `index.ts`            // Main entry point, exports parseAnnotations and types (types are defined directly in code, not in separate files)
  - `regex.ts`            // Regex patterns for annotation, flag, code block, comment detection
  - `blocks/`
    - `annotation.ts`     // Annotation block extraction logic
    - `annotation.test.ts`// Unit tests for annotation block extraction
    - `flag.ts`           // Flag extraction and validation logic
    - `flag.test.ts`      // Unit tests for flag extraction
    - `codeBlock.ts`      // Code block extraction and metadata logic
    - `codeBlock.test.ts` // Unit tests for code block extraction
    - `comment.ts`        // Comment extraction logic
    - `comment.test.ts`   // Unit tests for comment extraction
    - `plainText.ts`      // Plain text block extraction logic
    - `plainText.test.ts` // Unit tests for plain text extraction
  - `errors.ts`           // Error object construction and error handling utilities
  - `errors.test.ts`      // Unit tests for error handling
  - `utils.ts`            // Shared utility functions (e.g., line number tracking, whitespace trimming)
  - `utils.test.ts`       // Unit tests for utilities
  - `index.test.ts`       // Main parser unit tests

> **Note:** All TypeScript types must be defined inside the relevant code files, not in separate files. Test files should be placed next to their corresponding module files, not in a separate tests/ directory. This should also be reflected in the coding guideline for the project.
