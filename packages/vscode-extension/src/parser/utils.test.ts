/**
 * Unit tests for utility functions.
 */

import { describe, test, expect } from 'vitest';
import { isEmptyLine, trimLine, startsWith } from './utils';

describe('isEmptyLine', () => {
	test('returns true for empty string', () => {
		expect(isEmptyLine('')).toBe(true);
	});

	test('returns true for whitespace-only string', () => {
		expect(isEmptyLine('   ')).toBe(true);
		expect(isEmptyLine('\t\t')).toBe(true);
		expect(isEmptyLine('  \t  ')).toBe(true);
	});

	test('returns false for non-empty string', () => {
		expect(isEmptyLine('text')).toBe(false);
		expect(isEmptyLine('  text  ')).toBe(false);
	});
});

describe('trimLine', () => {
	test('trims whitespace from both ends', () => {
		expect(trimLine('  text  ')).toBe('text');
		expect(trimLine('\ttext\t')).toBe('text');
	});

	test('returns same string if no whitespace', () => {
		expect(trimLine('text')).toBe('text');
	});

	test('handles empty string', () => {
		expect(trimLine('')).toBe('');
		expect(trimLine('   ')).toBe('');
	});
});

describe('startsWith', () => {
	test('returns true when content starts with prefix', () => {
		expect(startsWith('hello world', 'hello')).toBe(true);
		expect(startsWith('@task', '@')).toBe(true);
	});

	test('returns false when content does not start with prefix', () => {
		expect(startsWith('hello world', 'world')).toBe(false);
		expect(startsWith('task', '@')).toBe(false);
	});

	test('handles empty strings', () => {
		expect(startsWith('', '')).toBe(true);
		expect(startsWith('text', '')).toBe(true);
		expect(startsWith('', 'x')).toBe(false);
	});
});
