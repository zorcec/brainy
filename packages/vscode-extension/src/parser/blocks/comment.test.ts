/**
 * Unit tests for comment extraction logic.
 */

import { describe, test, expect } from 'vitest';
import { isComment, extractCommentContent } from './comment';

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
});
