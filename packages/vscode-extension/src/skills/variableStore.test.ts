/**
 * Tests for the variableStore module.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
	getVariable,
	setVariable,
	clearVariable,
	clearAllVariables,
	getAllVariables
} from './variableStore';

describe('variableStore', () => {
	beforeEach(() => {
		// Clear all variables before each test
		clearAllVariables();
	});

	it('should return undefined for unset variable', () => {
		const value = getVariable('nonexistent');
		expect(value).toBeUndefined();
	});

	it('should set and get a variable', () => {
		setVariable('userName', 'John');
		const value = getVariable('userName');
		expect(value).toBe('John');
	});

	it('should overwrite existing variable', () => {
		setVariable('count', '1');
		setVariable('count', '2');
		const value = getVariable('count');
		expect(value).toBe('2');
	});

	it('should handle multiple variables', () => {
		setVariable('var1', 'value1');
		setVariable('var2', 'value2');
		setVariable('var3', 'value3');

		expect(getVariable('var1')).toBe('value1');
		expect(getVariable('var2')).toBe('value2');
		expect(getVariable('var3')).toBe('value3');
	});

	it('should be case-sensitive', () => {
		setVariable('userName', 'John');
		setVariable('username', 'Jane');

		expect(getVariable('userName')).toBe('John');
		expect(getVariable('username')).toBe('Jane');
		expect(getVariable('USERNAME')).toBeUndefined();
	});

	it('should clear a specific variable', () => {
		setVariable('var1', 'value1');
		setVariable('var2', 'value2');

		clearVariable('var1');

		expect(getVariable('var1')).toBeUndefined();
		expect(getVariable('var2')).toBe('value2');
	});

	it('should clear all variables', () => {
		setVariable('var1', 'value1');
		setVariable('var2', 'value2');
		setVariable('var3', 'value3');

		clearAllVariables();

		expect(getVariable('var1')).toBeUndefined();
		expect(getVariable('var2')).toBeUndefined();
		expect(getVariable('var3')).toBeUndefined();
	});

	it('should return all variables', () => {
		setVariable('var1', 'value1');
		setVariable('var2', 'value2');

		const all = getAllVariables();

		expect(all).toEqual({
			var1: 'value1',
			var2: 'value2'
		});
	});

	it('should return a copy of variables (not the original)', () => {
		setVariable('var1', 'value1');

		const all = getAllVariables();
		all.var1 = 'modified';
		all.var2 = 'new';

		// Original should not be affected
		expect(getVariable('var1')).toBe('value1');
		expect(getVariable('var2')).toBeUndefined();
	});

	it('should throw error if value is not a string', () => {
		expect(() => {
			// @ts-expect-error Testing invalid input
			setVariable('var1', 123);
		}).toThrow('Variable value must be a string');

		expect(() => {
			// @ts-expect-error Testing invalid input
			setVariable('var2', null);
		}).toThrow('Variable value must be a string');

		expect(() => {
			// @ts-expect-error Testing invalid input
			setVariable('var3', undefined);
		}).toThrow('Variable value must be a string');
	});

	it('should handle empty string values', () => {
		setVariable('empty', '');
		expect(getVariable('empty')).toBe('');
	});

	it('should handle special characters in variable names', () => {
		setVariable('var_with_underscore', 'value1');
		setVariable('var-with-dash', 'value2');
		setVariable('var.with.dot', 'value3');

		expect(getVariable('var_with_underscore')).toBe('value1');
		expect(getVariable('var-with-dash')).toBe('value2');
		expect(getVariable('var.with.dot')).toBe('value3');
	});
});
