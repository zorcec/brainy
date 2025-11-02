/**
 * Unit tests for annotation block extraction logic.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { parseAnnotationBlock } from './annotation';

// Mock the skill scanner to allow all skills in tests
vi.mock('../../skills/skillScanner', () => ({
	isSkillAvailable: () => true
}));

describe('parseAnnotationBlock', () => {
	test('parses simple annotation with no flags', () => {
		const lines = ['@task'];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block).toBeDefined();
		expect(result.block?.name).toBe('task');
		expect(result.block?.flags).toEqual([]);
		expect(result.nextLine).toBe(1);
	});

	test('parses annotation with single-line flags', () => {
		const lines = ['@task --prompt "Test" --variable "var"'];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.name).toBe('task');
		expect(result.block?.flags).toMatchObject([
			{ name: 'prompt', value: ['Test'] },
			{ name: 'variable', value: ['var'] }
		]);
	});

	test('parses annotation with direct values', () => {
		const lines = ['@context "main" "research"'];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.name).toBe('context');
		expect(result.block?.flags).toMatchObject([
			{ name: '', value: ['main', 'research'] }
		]);
	});

	test('parses multi-line annotation', () => {
		const lines = [
			'@task',
			'--prompt "Test"',
			'--variable "var"'
		];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.name).toBe('task');
		expect(result.block?.flags.length).toBe(2);
		expect(result.nextLine).toBe(3);
	});

	test('stops multi-line parsing at empty line', () => {
		const lines = [
			'@task',
			'--prompt "Test"',
			'',
			'--variable "var"'
		];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.flags.length).toBe(1);
		expect(result.nextLine).toBe(2);
	});

	test('stops multi-line parsing at next annotation', () => {
		const lines = [
			'@task',
			'--prompt "Test"',
			'@context "main"'
		];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.flags.length).toBe(1);
		expect(result.nextLine).toBe(2);
	});

	test('returns error for invalid annotation syntax', () => {
		const lines = ['@'];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.error).toBeDefined();
		expect(result.error?.type).toBe('INVALID_ANNOTATION');
		expect(result.block).toBeUndefined();
	});

	test('preserves line number', () => {
		const lines = ['text', 'text', '@task'];
		const result = parseAnnotationBlock(lines, 2);

		expect(result.block?.line).toBe(3); // 1-indexed
	});

	test('handles annotation with variable substitution', () => {
		const lines = ['@task --prompt "Use {{variable}}"'];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.flags[0].value).toEqual(['Use {{variable}}']);
	});

	test('handles mixed case annotation names', () => {
		const lines = ['@MyCustomTask'];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.name).toBe('MyCustomTask');
	});

	test('handles underscores in annotation names', () => {
		const lines = ['@my_custom_task'];
		const result = parseAnnotationBlock(lines, 0);

		expect(result.block?.name).toBe('my_custom_task');
	});
});
