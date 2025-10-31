/**
 * Unit tests for error handling utilities.
 */

import { describe, test, expect } from 'vitest';
import { createError, type ParserError } from './errors';

describe('createError', () => {
	test('creates error with all fields', () => {
		const error = createError('TEST_ERROR', 'Test message', 5, 'warning', 'Extra context');
		
		expect(error).toEqual({
			type: 'TEST_ERROR',
			message: 'Test message',
			line: 5,
			severity: 'warning',
			context: 'Extra context'
		});
	});

	test('creates error with minimal fields', () => {
		const error = createError('SIMPLE_ERROR', 'Simple message');
		
		expect(error.type).toBe('SIMPLE_ERROR');
		expect(error.message).toBe('Simple message');
		expect(error.severity).toBe('critical'); // default
		expect(error.line).toBeUndefined();
		expect(error.context).toBeUndefined();
	});

	test('defaults severity to critical', () => {
		const error = createError('ERROR', 'Message');
		expect(error.severity).toBe('critical');
	});

	test('accepts different severity levels', () => {
		const critical = createError('E1', 'msg', 1, 'critical');
		const warning = createError('E2', 'msg', 2, 'warning');
		const info = createError('E3', 'msg', 3, 'info');

		expect(critical.severity).toBe('critical');
		expect(warning.severity).toBe('warning');
		expect(info.severity).toBe('info');
	});
});
