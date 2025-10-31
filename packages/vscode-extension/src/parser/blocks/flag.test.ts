/**
 * Unit tests for flag extraction logic.
 */

import { describe, test, expect } from 'vitest';
import { parseFlags, parseValues, parseFlagsOrValues, type Flag } from './flag';

describe('parseValues', () => {
	test('parses single quoted value', () => {
		expect(parseValues('"hello"')).toEqual(['hello']);
	});

	test('parses multiple quoted values', () => {
		expect(parseValues('"value1" "value2" "value3"')).toEqual(['value1', 'value2', 'value3']);
	});

	test('parses single unquoted value', () => {
		expect(parseValues('hello')).toEqual(['hello']);
	});

	test('parses mixed quoted and unquoted values', () => {
		expect(parseValues('"quoted" unquoted "another"')).toEqual(['quoted', 'unquoted', 'another']);
	});

	test('parses empty quoted string', () => {
		expect(parseValues('""')).toEqual(['']);
	});

	test('returns empty array for empty string', () => {
		expect(parseValues('')).toEqual([]);
		expect(parseValues('   ')).toEqual([]);
	});

	test('preserves whitespace inside quotes', () => {
		expect(parseValues('"  spaces  "')).toEqual(['  spaces  ']);
	});

	test('handles variable substitution patterns', () => {
		expect(parseValues('"Use {{variable}}"')).toEqual(['Use {{variable}}']);
	});
});

describe('parseFlags', () => {
	test('parses single flag with quoted value', () => {
		const result = parseFlags('--prompt "test"');
		expect(result).toEqual([
			{ name: 'prompt', value: ['test'] }
		]);
	});

	test('parses multiple flags', () => {
		const result = parseFlags('--prompt "test" --variable "var"');
		expect(result).toEqual([
			{ name: 'prompt', value: ['test'] },
			{ name: 'variable', value: ['var'] }
		]);
	});

	test('parses flag with no value', () => {
		const result = parseFlags('--flag1');
		expect(result).toEqual([
			{ name: 'flag1', value: [] }
		]);
	});

	test('parses flag with multiple values', () => {
		const result = parseFlags('--values "a" "b" "c"');
		expect(result).toEqual([
			{ name: 'values', value: ['a', 'b', 'c'] }
		]);
	});

	test('parses flag with unquoted value', () => {
		const result = parseFlags('--count 42');
		expect(result).toEqual([
			{ name: 'count', value: ['42'] }
		]);
	});

	test('handles extra whitespace', () => {
		const result = parseFlags('--flag1 "test"     --flag2 "value"');
		expect(result.length).toBe(2);
	});

	test('handles empty quoted value', () => {
		const result = parseFlags('--prompt ""');
		expect(result).toEqual([
			{ name: 'prompt', value: [''] }
		]);
	});
});

describe('parseFlagsOrValues', () => {
	test('parses flags when content starts with --', () => {
		const result = parseFlagsOrValues('--prompt "test"');
		expect(result).toEqual([
			{ name: 'prompt', value: ['test'] }
		]);
	});

	test('parses direct quoted values', () => {
		const result = parseFlagsOrValues('"main" "research"');
		expect(result).toEqual([
			{ name: '', value: ['main', 'research'] }
		]);
	});

	test('parses direct unquoted value', () => {
		const result = parseFlagsOrValues('gpt-4.1');
		expect(result).toEqual([
			{ name: '', value: ['gpt-4.1'] }
		]);
	});

	test('returns empty array for single dash prefix', () => {
		const result = parseFlagsOrValues('-invalid');
		expect(result).toEqual([]);
	});

	test('returns empty array for empty string', () => {
		const result = parseFlagsOrValues('');
		expect(result).toEqual([]);
	});
});
