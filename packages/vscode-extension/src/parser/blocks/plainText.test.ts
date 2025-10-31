/**
 * Unit tests for plain text and comment block creation.
 */

import { describe, test, expect } from 'vitest';
import { createPlainTextBlock, createCommentBlock } from './plainText';

describe('createPlainTextBlock', () => {
	test('creates plain text block with content', () => {
		const block = createPlainTextBlock('Some text here');
		
		expect(block.name).toBe('plainText');
		expect(block.content).toBe('Some text here');
		expect(block.flags).toEqual([]);
		expect(block.line).toBeUndefined();
	});

	test('creates plain text block with line number', () => {
		const block = createPlainTextBlock('Text', 5);
		
		expect(block.line).toBe(5);
	});

	test('handles empty content', () => {
		const block = createPlainTextBlock('');
		
		expect(block.content).toBe('');
		expect(block.name).toBe('plainText');
	});
});

describe('createCommentBlock', () => {
	test('creates comment block with content', () => {
		const block = createCommentBlock('This is a comment');
		
		expect(block.name).toBe('plainComment');
		expect(block.content).toBe('This is a comment');
		expect(block.flags).toEqual([]);
		expect(block.line).toBeUndefined();
	});

	test('creates comment block with line number', () => {
		const block = createCommentBlock('Comment', 10);
		
		expect(block.line).toBe(10);
	});

	test('handles empty comment content', () => {
		const block = createCommentBlock('');
		
		expect(block.content).toBe('');
		expect(block.name).toBe('plainComment');
	});
});
