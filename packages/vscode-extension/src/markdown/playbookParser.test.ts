/**
 * Unit tests for playbookParser module
 */

import { describe, test, expect } from 'vitest';
import { parsePlaybook } from './playbookParser';

describe('parsePlaybook', () => {
	test('should parse valid playbook with annotations', () => {
		const markdown = `
@model "gpt-4.1"
@task --prompt "Summarize the topic" --variable "result"
`;
		const result = parsePlaybook(markdown);

		expect(result.blocks).toHaveLength(2);
		expect(result.errors).toHaveLength(0);
		expect(result.blocks[0].name).toBe('model');
		expect(result.blocks[1].name).toBe('task');
	});

	test('should parse playbook with code blocks', () => {
		const markdown = `
@task "Execute the script"

\`\`\`bash
echo "Hello World"
\`\`\`
`;
		const result = parsePlaybook(markdown);

		expect(result.blocks).toHaveLength(2);
		expect(result.errors).toHaveLength(0);
		expect(result.blocks[0].name).toBe('task');
		expect(result.blocks[1].name).toBe('plainCodeBlock');
	});

	test('should parse playbook with comments', () => {
		const markdown = `
@model "gpt-4.1"
<!-- This is a comment -->
@task "Do something"
`;
		const result = parsePlaybook(markdown);

		expect(result.blocks).toHaveLength(3);
		expect(result.errors).toHaveLength(0);
		expect(result.blocks[1].name).toBe('plainComment');
	});

	test('should return errors for unclosed code blocks', () => {
		const markdown = `
@task "Execute the script"

\`\`\`bash
echo "Hello World"
`;
		const result = parsePlaybook(markdown);

		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].type).toBe('UnclosedCodeBlock');
	});

	test('should handle empty markdown', () => {
		const markdown = '';
		const result = parsePlaybook(markdown);

		expect(result.blocks).toHaveLength(0);
		expect(result.errors).toHaveLength(0);
	});

	test('should parse complex playbook with multiple annotation types', () => {
		const markdown = `
@model "gpt-4.1"
@context "main" "research"
@task --prompt "Research the topic" --variable "research_result"

\`\`\`python
print("Processing data")
\`\`\`

<!-- Next step -->
@task "Summarize findings"
`;
		const result = parsePlaybook(markdown);

		expect(result.blocks.length).toBeGreaterThan(3);
		expect(result.errors).toHaveLength(0);
	});

	test('should handle malformed annotations gracefully', () => {
		const markdown = `
@model "gpt-4.1"
@bad-annotation without proper format
@task "Valid task"
`;
		const result = parsePlaybook(markdown);

		// Should still parse valid annotations
		expect(result.blocks.length).toBeGreaterThan(0);
		// May or may not have errors depending on parser implementation
	});

	test('should parse annotations with multi-line flags', () => {
		const markdown = `
@task
  --prompt "This is a long
    multi-line prompt"
  --variable "result"
`;
		const result = parsePlaybook(markdown);

		// The parser may split this into multiple blocks based on implementation
		expect(result.blocks.length).toBeGreaterThan(0);
		const taskBlock = result.blocks.find(b => b.name === 'task');
		expect(taskBlock).toBeDefined();
		expect(taskBlock!.flags.length).toBeGreaterThan(0);
	});

	test('should return pretty JSON structure', () => {
		const markdown = '@model "gpt-4.1"';
		const result = parsePlaybook(markdown);

		// Ensure the result can be stringified to JSON
		const json = JSON.stringify(result, null, 2);
		expect(json).toContain('"blocks"');
		expect(json).toContain('"errors"');
		expect(typeof json).toBe('string');
	});

	test('should handle very large markdown files', () => {
		// Generate a large markdown file with many annotations
		let markdown = '';
		for (let i = 0; i < 1000; i++) {
			markdown += `@task "Task ${i}"\n`;
		}

		const result = parsePlaybook(markdown);

		expect(result.blocks).toHaveLength(1000);
		expect(result.errors).toHaveLength(0);
	});
});
