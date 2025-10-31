/**
 * Integration tests for the main parser.
 * Tests the complete parsing workflow with real-world examples.
 */

import { describe, test, expect } from 'vitest';
import { parseAnnotations } from './index';

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
		expect(result.blocks[0].flags).toEqual([
			{ name: 'prompt', value: ['Summarize the topic'] },
			{ name: 'variable', value: ['topic'] }
		]);
		
		// Plain text
		expect(result.blocks[1].name).toBe('plainText');
		expect(result.blocks[1].content).toBe('Some introductory text here.');
		
		// Context annotation
		expect(result.blocks[2].name).toBe('context');
		expect(result.blocks[2].flags).toEqual([
			{ name: '', value: ['main', 'research'] }
		]);
		
		// Comment
		expect(result.blocks[3].name).toBe('plainComment');
		expect(result.blocks[3].content).toBe('This is a comment about the context');
		
		// Model annotation
		expect(result.blocks[4].name).toBe('model');
		expect(result.blocks[4].flags).toEqual([
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
