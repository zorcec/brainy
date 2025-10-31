/**
 * Unit tests for comment extraction logic.
 */

import { describe, test, expect } from 'vitest';
import { isComment, isCommentStart, isCommentEnd, extractCommentContent, parseCommentBlock } from './comment';

describe('isComment', () => {
	test('returns true for valid HTML comment', () => {
		expect(isComment('<!-- This is a comment -->')).toBe(true);
	});

	test('returns true for comment with extra whitespace', () => {
		expect(isComment('<!--   Extra spaces   -->')).toBe(true);
	});

	test('returns false for non-comment text', () => {
		expect(isComment('Plain text')).toBe(false);
		expect(isComment('@annotation')).toBe(false);
	});

	test('returns false for incomplete comment', () => {
		expect(isComment('<!-- Missing end')).toBe(false);
		expect(isComment('Missing start -->')).toBe(false);
	});

	test('returns false for multi-line comment start', () => {
		expect(isComment('<!-- Start only')).toBe(false);
	});
});

describe('isCommentStart', () => {
	test('returns true for single-line comment', () => {
		expect(isCommentStart('<!-- This is a comment -->')).toBe(true);
	});

	test('returns true for multi-line comment start', () => {
		expect(isCommentStart('<!-- Start of comment')).toBe(true);
		expect(isCommentStart('<!--')).toBe(true);
	});

	test('returns false for non-comment text', () => {
		expect(isCommentStart('Plain text')).toBe(false);
		expect(isCommentStart('End only -->')).toBe(false);
	});
});

describe('isCommentEnd', () => {
	test('returns true for single-line comment', () => {
		expect(isCommentEnd('<!-- This is a comment -->')).toBe(true);
	});

	test('returns true for multi-line comment end', () => {
		expect(isCommentEnd('End of comment -->')).toBe(true);
		expect(isCommentEnd('-->')).toBe(true);
	});

	test('returns false for non-comment text', () => {
		expect(isCommentEnd('Plain text')).toBe(false);
		expect(isCommentEnd('<!-- Start only')).toBe(false);
	});
});

describe('extractCommentContent', () => {
	test('extracts content from simple comment', () => {
		expect(extractCommentContent('<!-- Hello -->')).toBe('Hello');
	});

	test('trims whitespace from content', () => {
		expect(extractCommentContent('<!--   Extra spaces   -->')).toBe('Extra spaces');
	});

	test('handles empty comment', () => {
		expect(extractCommentContent('<!--  -->')).toBe('');
	});

	test('handles comment with special characters', () => {
		expect(extractCommentContent('<!-- @task & <test> -->')).toBe('@task & <test>');
	});

	test('handles multi-line comment content', () => {
		// Note: This tests content extraction, not the full multi-line parsing
		const content = 'Multi-line\ncomment';
		expect(extractCommentContent(`<!-- ${content} -->`)).toBe(content);
	});
});

describe('parseCommentBlock', () => {
	test('parses single-line comment', () => {
		const lines = ['<!-- This is a comment -->'];
		const result = parseCommentBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.name).toBe('plainComment');
		expect(result.block?.content).toBe('This is a comment');
		expect(result.block?.flags).toEqual([]);
		expect(result.block?.line).toBe(1);
		expect(result.nextLine).toBe(1);
	});

	test('parses multi-line comment (story example)', () => {
		const lines = [
			'<!--',
			'Multi-line',
			'comment',
			'-->'
		];
		const result = parseCommentBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.name).toBe('plainComment');
		expect(result.block?.content).toBe('Multi-line\ncomment');
		expect(result.block?.flags).toEqual([]);
		expect(result.block?.line).toBe(1);
		expect(result.nextLine).toBe(4);
	});

	test('parses multi-line comment with content on first and last line', () => {
		const lines = [
			'<!-- Start',
			'Middle line',
			'End -->'
		];
		const result = parseCommentBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.content).toBe('Start\nMiddle line\nEnd');
		expect(result.nextLine).toBe(3);
	});

	test('parses multi-line comment with extra whitespace', () => {
		const lines = [
			'<!--   ',
			'  Content with spaces  ',
			'  -->'
		];
		const result = parseCommentBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.content).toBe('Content with spaces');
		expect(result.nextLine).toBe(3);
	});

	test('handles empty multi-line comment', () => {
		const lines = [
			'<!--',
			'-->'
		];
		const result = parseCommentBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.content).toBe('');
		expect(result.nextLine).toBe(2);
	});

	test('handles comment with special characters', () => {
		const lines = ['<!-- @annotation --flag "value" -->'];
		const result = parseCommentBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.content).toBe('@annotation --flag "value"');
	});

	test('preserves line content in multi-line comment', () => {
		const lines = [
			'<!-- Comment about',
			'the following code:',
			'  - Item 1',
			'  - Item 2',
			'-->'
		];
		const result = parseCommentBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.content).toBe('Comment about\nthe following code:\n  - Item 1\n  - Item 2');
	});
});
