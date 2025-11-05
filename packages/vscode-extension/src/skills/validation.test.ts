/**
 * Tests for validation utilities.
 */

import { describe, it, expect } from 'vitest';
import { validateRequiredString, isValidString } from './validation';

describe('validateRequiredString', () => {
	it('should not throw for valid non-empty string', () => {
		expect(() => validateRequiredString('test', 'param')).not.toThrow();
		expect(() => validateRequiredString('hello world', 'param')).not.toThrow();
	});

	it('should throw for undefined', () => {
		expect(() => validateRequiredString(undefined, 'prompt')).toThrow('Missing or invalid prompt');
	});

	it('should throw for null', () => {
		expect(() => validateRequiredString(null, 'prompt')).toThrow('Missing or invalid prompt');
	});

	it('should throw for empty string', () => {
		expect(() => validateRequiredString('', 'prompt')).toThrow('Missing or invalid prompt');
	});

	it('should throw for whitespace-only string', () => {
		expect(() => validateRequiredString('   ', 'prompt')).toThrow('Missing or invalid prompt');
		expect(() => validateRequiredString('\t\n', 'prompt')).toThrow('Missing or invalid prompt');
	});

	it('should throw for non-string values', () => {
		expect(() => validateRequiredString(123, 'prompt')).toThrow('Missing or invalid prompt');
		expect(() => validateRequiredString(true, 'prompt')).toThrow('Missing or invalid prompt');
		expect(() => validateRequiredString({}, 'prompt')).toThrow('Missing or invalid prompt');
		expect(() => validateRequiredString([], 'prompt')).toThrow('Missing or invalid prompt');
	});

	it('should include parameter name in error message', () => {
		expect(() => validateRequiredString('', 'userName')).toThrow('Missing or invalid userName');
		expect(() => validateRequiredString('', 'apiKey')).toThrow('Missing or invalid apiKey');
	});
});

describe('isValidString', () => {
	it('should return true for valid non-empty strings', () => {
		expect(isValidString('test')).toBe(true);
		expect(isValidString('hello world')).toBe(true);
		expect(isValidString('123')).toBe(true);
	});

	it('should return false for empty string', () => {
		expect(isValidString('')).toBe(false);
	});

	it('should return false for whitespace-only string', () => {
		expect(isValidString('   ')).toBe(false);
		expect(isValidString('\t\n')).toBe(false);
	});

	it('should return false for non-string values', () => {
		expect(isValidString(undefined)).toBe(false);
		expect(isValidString(null)).toBe(false);
		expect(isValidString(123)).toBe(false);
		expect(isValidString(true)).toBe(false);
		expect(isValidString({})).toBe(false);
		expect(isValidString([])).toBe(false);
	});
});
