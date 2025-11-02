/**
 * Integration tests for the main parser.
 * Tests the complete parsing workflow with real-world examples.
 */

import { describe, it, test, expect, beforeEach, vi } from 'vitest';
import { parseAnnotations } from './index';

// Mock the skill scanner to allow all skills in tests
vi.mock('../skills/skillScanner', () => ({
	getAvailableSkills: () => ['execute', 'context', 'task', 'model', 'annotation', 'another_annotation'],
	isSkillAvailable: () => true,  // Allow all skills in tests
	refreshSkills: vi.fn()
}));

describe('parseAnnotations - Integration Tests', () => {
	test('parses empty markdown', () => {
		const result = parseAnnotations('');
		expect(result.blocks).toEqual([]);
		expect(result.errors).toEqual([]);
	});

	test('parses simple annotation', () => {
		const md = '@task --prompt "Test"';
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('task');
		expect(result.blocks[0].flags[0].value).toEqual(['Test']);
	});

	test('parses complex real-world example from story', () => {
		const md = `@task --prompt "Summarize the topic" --variable "topic"
Some introductory text here.
@context "main" "research"
<!-- This is a comment about the context -->
@model "gpt-4.1"`;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(5);
		
		// First annotation
		expect(result.blocks[0].name).toBe('task');
		expect(result.blocks[0].flags).toMatchObject([
			{ name: 'prompt', value: ['Summarize the topic'] },
			{ name: 'variable', value: ['topic'] }
		]);
		
		// Plain text
		expect(result.blocks[1].name).toBe('plainText');
		expect(result.blocks[1].content).toBe('Some introductory text here.');
		
		// Context annotation
		expect(result.blocks[2].name).toBe('context');
		expect(result.blocks[2].flags).toMatchObject([
			{ name: '', value: ['main', 'research'] }
		]);
		
		// Comment
		expect(result.blocks[3].name).toBe('plainComment');
		expect(result.blocks[3].content).toBe('This is a comment about the context');
		
		// Model annotation
		expect(result.blocks[4].name).toBe('model');
		expect(result.blocks[4].flags).toMatchObject([
			{ name: '', value: ['gpt-4.1'] }
		]);
	});

	test('parses multi-line annotation workflow', () => {
		const md = `@model "gpt-4.1"
@context "main"

You're a senior software engineer.

@task "Research {{topic}} online"

@context "specifications"

@task
   --prompt "Check which specifications are relevant"
   --variable relevant_specs`;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(6); // 5 annotations + 1 plain text
		
		// Verify annotations are parsed correctly
		const annotations = result.blocks.filter(b => !['plainText', 'plainComment'].includes(b.name));
		expect(annotations.length).toBe(5);
		
		// Verify multi-line annotation
		const multiLineTask = annotations[4];
		expect(multiLineTask.name).toBe('task');
		expect(multiLineTask.flags.length).toBe(2);
		expect(multiLineTask.flags[0].name).toBe('prompt');
		expect(multiLineTask.flags[1].name).toBe('variable');
	});

	test('handles errors gracefully', () => {
		const md = '@';
		const result = parseAnnotations(md);
		
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.errors[0].type).toBe('INVALID_ANNOTATION');
	});

	test('parses mixed content types', () => {
		const md = `Plain text line 1
@annotation --flag "value"
<!-- Comment -->
More text
@another_annotation`;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(5);
		expect(result.blocks[0].name).toBe('plainText');
		expect(result.blocks[1].name).toBe('annotation');
		expect(result.blocks[2].name).toBe('plainComment');
		expect(result.blocks[3].name).toBe('plainText');
		expect(result.blocks[4].name).toBe('another_annotation');
	});

	test('preserves variable substitution patterns', () => {
		const md = '@task --prompt "Use {{variable}} and ${another}"';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].value[0]).toBe('Use {{variable}} and ${another}');
	});

	test('handles Unicode and special characters', () => {
		const md = '@task --prompt "こんにちは 世界 🌍"';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].value).toEqual(['こんにちは 世界 🌍']);
	});

	test('handles empty quoted values', () => {
		const md = '@task --prompt ""';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].value).toEqual(['']);
	});

	test('handles flags without values', () => {
		const md = '@task --flag1';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].name).toBe('flag1');
		expect(result.blocks[0].flags[0].value).toEqual([]);
	});

	test('handles consecutive annotations', () => {
		const md = '@task\n@context\n@model';
		const result = parseAnnotations(md);
		
		expect(result.blocks.length).toBe(3);
		expect(result.blocks.map(b => b.name)).toEqual(['task', 'context', 'model']);
	});

	test('preserves line numbers correctly', () => {
		const md = `Line 1
@task
Line 3`;
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].line).toBe(1);
		expect(result.blocks[1].line).toBe(2);
		expect(result.blocks[2].line).toBe(3);
	});

	test('handles very long values', () => {
		const longValue = 'This is a very long value '.repeat(20);
		const md = `@task --prompt "${longValue}"`;
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].value[0]).toBe(longValue);
	});

	test('handles whitespace variations', () => {
		const md = '   @task   --prompt "test"   ';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].name).toBe('task');
		expect(result.blocks[0].flags[0].value).toEqual(['test']);
	});

	test('preserves whitespace inside quoted values', () => {
		const md = '@task --prompt "  extra  spaces  "';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].value).toEqual(['  extra  spaces  ']);
	});

	test('handles numeric values', () => {
		const md = '@setting --count 42 --threshold 3.14';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].value).toEqual(['42']);
		expect(result.blocks[0].flags[1].value).toEqual(['3.14']);
	});

	test('handles URLs in values', () => {
		const md = '@task --url "https://example.com/path?query=value"';
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].flags[0].value).toEqual(['https://example.com/path?query=value']);
	});
});

describe('parseAnnotations - Code Block Integration Tests', () => {
	test('Test 1: Basic code block and context combination', () => {
		const md = `@execute
\`\`\`bash
echo "Hello World"
\`\`\`
@context "main" "research"`;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(3);
		
		// Execute annotation
		expect(result.blocks[0].name).toBe('execute');
		expect(result.blocks[0].flags).toEqual([]);
		
		// Code block
		expect(result.blocks[1].name).toBe('plainCodeBlock');
		expect(result.blocks[1].content).toBe('echo "Hello World"');
		expect(result.blocks[1].metadata?.language).toBe('bash');
		expect(result.blocks[1].flags).toEqual([]);
		
		// Context annotation
		expect(result.blocks[2].name).toBe('context');
		expect(result.blocks[2].flags).toMatchObject([
			{ name: '', value: ['main', 'research'] }
		]);
	});

	test('Test 2: Code block with no language', () => {
		const md = `@execute
\`\`\`
echo "No language"
\`\`\``;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(2);
		expect(result.blocks[1].name).toBe('plainCodeBlock');
		expect(result.blocks[1].content).toBe('echo "No language"');
		expect(result.blocks[1].metadata?.language).toBeUndefined();
	});

	test('Test 3: Context with single value', () => {
		const md = '@context "main"';
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('context');
		expect(result.blocks[0].flags).toMatchObject([
			{ name: '', value: ['main'] }
		]);
	});

	test('Test 4: Edge case - empty code block', () => {
		const md = `@execute
\`\`\`python
\`\`\``;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(2);
		expect(result.blocks[1].name).toBe('plainCodeBlock');
		expect(result.blocks[1].content).toBe('');
		expect(result.blocks[1].metadata?.language).toBe('python');
	});

	test('Test 5: Edge case - annotation with no code block', () => {
		const md = `@execute
@context "main"`;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(2);
		expect(result.blocks[0].name).toBe('execute');
		expect(result.blocks[1].name).toBe('context');
	});

	test('Test 6: Plain text (no annotation)', () => {
		const md = 'This is a plain text line.';
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('plainText');
		expect(result.blocks[0].content).toBe('This is a plain text line.');
	});

	test('Test 7: Multiple code blocks after annotation', () => {
		const md = `@execute
\`\`\`bash
echo "First"
\`\`\`
\`\`\`python
print("Second")
\`\`\``;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(3);
		
		expect(result.blocks[0].name).toBe('execute');
		
		expect(result.blocks[1].name).toBe('plainCodeBlock');
		expect(result.blocks[1].content).toBe('echo "First"');
		expect(result.blocks[1].metadata?.language).toBe('bash');
		
		expect(result.blocks[2].name).toBe('plainCodeBlock');
		expect(result.blocks[2].content).toBe('print("Second")');
		expect(result.blocks[2].metadata?.language).toBe('python');
	});

	test('Test 8: Context annotation with no quoted values (no error)', () => {
		const md = '@context';
		const result = parseAnnotations(md);
		
		// Context with no values is valid, just has empty flags
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('context');
		expect(result.blocks[0].flags).toEqual([]);
	});

	test('Test 9: Malformed annotation (missing @)', () => {
		const md = 'context "main"';
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('plainText');
		expect(result.blocks[0].content).toBe('context "main"');
	});

	test('Test 10: Unclosed code block (critical error)', () => {
		const md = `@execute
\`\`\`bash
echo "Hello World"`;

		const result = parseAnnotations(md);
		
		expect(result.errors.length).toBe(1);
		expect(result.errors[0].type).toBe('UnclosedCodeBlock');
		expect(result.errors[0].message).toBe('Unclosed code block detected.');
		expect(result.errors[0].severity).toBe('critical');
	});

	test('Test 11: Annotation with no flags', () => {
		const md = '@execute';
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('execute');
		expect(result.blocks[0].flags).toEqual([]);
	});

	test('Code blocks preserve language case sensitivity', () => {
		const md = `\`\`\`TypeScript
const x = 1;
\`\`\``;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks[0].metadata?.language).toBe('TypeScript');
	});

	test('Multiple code blocks with different languages', () => {
		const md = `\`\`\`javascript
console.log('test');
\`\`\`

\`\`\`python
print('test')
\`\`\``;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(2);
		expect(result.blocks[0].metadata?.language).toBe('javascript');
		expect(result.blocks[1].metadata?.language).toBe('python');
	});

	test('Code block with special characters and quotes', () => {
		const md = `\`\`\`bash
echo "Hello $VAR" && echo 'test'
\`\`\``;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks[0].content).toBe('echo "Hello $VAR" && echo \'test\'');
	});

	test('Context combination with multiple contexts', () => {
		const md = '@context "main" "research" "development"';
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks[0].flags).toMatchObject([
			{ name: '', value: ['main', 'research', 'development'] }
		]);
	});

	test('Full workflow from story example', () => {
		const md = `@execute
\`\`\`bash
echo "Hello World"
\`\`\`
@context "main" "research"`;

		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(3);
		
		// Verify structure matches expected output
		expect(result.blocks[0]).toMatchObject({
			name: 'execute',
			flags: [],
			line: 1
		});
		
		expect(result.blocks[1]).toMatchObject({
			name: 'plainCodeBlock',
			content: 'echo "Hello World"',
			metadata: { language: 'bash' },
			flags: [],
			line: 2
		});
		
		expect(result.blocks[2]).toMatchObject({
			name: 'context',
			flags: [{ name: '', value: ['main', 'research'] }],
			line: 5
		});
	});
});

describe('parseAnnotations - Comment Integration Tests', () => {
	test('parses single-line comment (from story example)', () => {
		const md = '<!-- This is a comment -->';
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0]).toMatchObject({
			name: 'plainComment',
			flags: [],
			content: 'This is a comment'
		});
	});

	test('parses multi-line comment (from story example)', () => {
		const md = `<!--
Multi-line
comment
-->`;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0]).toMatchObject({
			name: 'plainComment',
			flags: [],
			content: 'Multi-line\ncomment'
		});
	});

	test('comments inside code blocks are NOT parsed as standalone comments', () => {
		const md = `\`\`\`bash
<!-- This is inside a code block -->
echo "test"
\`\`\``;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('plainCodeBlock');
		expect(result.blocks[0].content).toContain('<!-- This is inside a code block -->');
		
		// Verify no comment blocks were created
		const commentBlocks = result.blocks.filter(b => b.name === 'plainComment');
		expect(commentBlocks.length).toBe(0);
	});

	test('comments before and after code blocks are parsed correctly', () => {
		const md = `<!-- Comment before -->
\`\`\`bash
echo "code"
\`\`\`
<!-- Comment after -->`;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(3);
		
		expect(result.blocks[0].name).toBe('plainComment');
		expect(result.blocks[0].content).toBe('Comment before');
		
		expect(result.blocks[1].name).toBe('plainCodeBlock');
		expect(result.blocks[1].content).toBe('echo "code"');
		
		expect(result.blocks[2].name).toBe('plainComment');
		expect(result.blocks[2].content).toBe('Comment after');
	});

	test('multi-line comment with annotations inside is not parsed as annotations', () => {
		const md = `<!--
@task --flag "value"
@context "main"
-->`;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('plainComment');
		expect(result.blocks[0].content).toContain('@task');
		expect(result.blocks[0].content).toContain('@context');
		
		// Verify no annotation blocks were created
		const annotationBlocks = result.blocks.filter(b => b.name !== 'plainComment');
		expect(annotationBlocks.length).toBe(0);
	});

	test('mixed content with comments, annotations, and code blocks', () => {
		const md = `@task --prompt "Test"
<!-- This is a comment -->
\`\`\`bash
# Shell comment, not HTML
echo "test"
\`\`\`
<!-- Another comment -->
@context "main"`;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(5);
		
		expect(result.blocks[0].name).toBe('task');
		expect(result.blocks[1].name).toBe('plainComment');
		expect(result.blocks[1].content).toBe('This is a comment');
		expect(result.blocks[2].name).toBe('plainCodeBlock');
		expect(result.blocks[3].name).toBe('plainComment');
		expect(result.blocks[3].content).toBe('Another comment');
		expect(result.blocks[4].name).toBe('context');
	});

	test('empty comments are handled correctly', () => {
		const md = `<!-- -->`;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].name).toBe('plainComment');
		expect(result.blocks[0].content).toBe('');
	});

	test('comment with special characters and symbols', () => {
		const md = `<!-- Special: @#$%^&*() <>"'{}[] -->`;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(1);
		expect(result.blocks[0].content).toBe('Special: @#$%^&*() <>"\'{}[]');
	});

	test('multiple consecutive comments', () => {
		const md = `<!-- Comment 1 -->
<!-- Comment 2 -->
<!-- Comment 3 -->`;
		const result = parseAnnotations(md);
		
		expect(result.errors).toEqual([]);
		expect(result.blocks.length).toBe(3);
		expect(result.blocks.every(b => b.name === 'plainComment')).toBe(true);
		expect(result.blocks[0].content).toBe('Comment 1');
		expect(result.blocks[1].content).toBe('Comment 2');
		expect(result.blocks[2].content).toBe('Comment 3');
	});

	test('comment line numbers are tracked correctly', () => {
		const md = `Line 1
<!-- Comment on line 2 -->
Line 3`;
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].line).toBe(1);
		expect(result.blocks[1].line).toBe(2);
		expect(result.blocks[1].name).toBe('plainComment');
		expect(result.blocks[2].line).toBe(3);
	});

	test('multi-line comment line numbers are tracked correctly', () => {
		const md = `Line 1
<!--
Comment starts line 2
Comment ends line 4
-->
Line 5`;
		const result = parseAnnotations(md);
		
		expect(result.blocks[0].line).toBe(1);
		expect(result.blocks[1].line).toBe(2); // Comment starts on line 2
		expect(result.blocks[1].name).toBe('plainComment');
		expect(result.blocks[2].line).toBe(6); // Line 5 in content, line 6 in 1-indexed
	});
});

