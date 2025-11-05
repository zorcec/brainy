/**
 * Tests for the input skill.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { inputSkill } from './input';
import { createMockSkillApi } from '../testUtils';
import type { SkillApi } from '../types';

describe('input skill', () => {
	let mockApi: SkillApi;

	beforeEach(() => {
		mockApi = createMockSkillApi();
	});

	it('should have correct name and description', () => {
		expect(inputSkill.name).toBe('input');
		expect(inputSkill.description).toBeTruthy();
		expect(inputSkill.description).toContain('input');
	});

	it('should prompt user and store input in variable', async () => {
		mockApi.openInputDialog = vi.fn(async () => 'John Doe');
		mockApi.setVariable = vi.fn();

		await inputSkill.execute(mockApi, {
			prompt: 'Enter your name',
			variable: 'userName'
		});

		expect(mockApi.openInputDialog).toHaveBeenCalledWith('Enter your name');
		expect(mockApi.setVariable).toHaveBeenCalledWith('userName', 'John Doe');
	});

	it('should return user-type message with prompt and value', async () => {
		mockApi.openInputDialog = vi.fn(async () => 'test value');
		mockApi.setVariable = vi.fn();

		const result = await inputSkill.execute(mockApi, {
			prompt: 'Enter something',
			variable: 'myVar'
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[0].content).toBe('Enter something: test value');
	});

	it('should throw error if prompt is missing', async () => {
		await expect(inputSkill.execute(mockApi, {
			variable: 'userName'
		})).rejects.toThrow('Missing or invalid prompt');
	});

	it('should throw error if prompt is empty', async () => {
		await expect(inputSkill.execute(mockApi, {
			prompt: '',
			variable: 'userName'
		})).rejects.toThrow('Missing or invalid prompt');
	});

	it('should throw error if prompt is whitespace only', async () => {
		await expect(inputSkill.execute(mockApi, {
			prompt: '   ',
			variable: 'userName'
		})).rejects.toThrow('Missing or invalid prompt');
	});

	it('should throw error if prompt is not a string', async () => {
		await expect(inputSkill.execute(mockApi, {
			prompt: 123 as any,
			variable: 'userName'
		})).rejects.toThrow('Missing or invalid prompt');
	});

	it('should throw error if variable is missing', async () => {
		await expect(inputSkill.execute(mockApi, {
			prompt: 'Enter your name'
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is empty', async () => {
		await expect(inputSkill.execute(mockApi, {
			prompt: 'Enter your name',
			variable: ''
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is whitespace only', async () => {
		await expect(inputSkill.execute(mockApi, {
			prompt: 'Enter your name',
			variable: '   '
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if variable is not a string', async () => {
		await expect(inputSkill.execute(mockApi, {
			prompt: 'Enter your name',
			variable: 123 as any
		})).rejects.toThrow('Missing or invalid variable name');
	});

	it('should throw error if user cancels input', async () => {
		mockApi.openInputDialog = vi.fn(async () => {
			throw new Error('User cancelled input');
		});

		await expect(inputSkill.execute(mockApi, {
			prompt: 'Enter your name',
			variable: 'userName'
		})).rejects.toThrow('User cancelled input');
	});

	it('should handle empty string input', async () => {
		mockApi.openInputDialog = vi.fn(async () => '');
		mockApi.setVariable = vi.fn();

		await inputSkill.execute(mockApi, {
			prompt: 'Enter value',
			variable: 'myVar'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('myVar', '');
	});

	it('should handle special characters in input', async () => {
		mockApi.openInputDialog = vi.fn(async () => 'test@example.com!@#$%');
		mockApi.setVariable = vi.fn();

		await inputSkill.execute(mockApi, {
			prompt: 'Enter email',
			variable: 'email'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('email', 'test@example.com!@#$%');
	});

	it('should handle multi-word input', async () => {
		mockApi.openInputDialog = vi.fn(async () => 'This is a long input with spaces');
		mockApi.setVariable = vi.fn();

		await inputSkill.execute(mockApi, {
			prompt: 'Enter description',
			variable: 'description'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('description', 'This is a long input with spaces');
	});

	it('should handle numeric input as string', async () => {
		mockApi.openInputDialog = vi.fn(async () => '12345');
		mockApi.setVariable = vi.fn();

		await inputSkill.execute(mockApi, {
			prompt: 'Enter number',
			variable: 'count'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('count', '12345');
	});

	it('should pass prompt text exactly as provided', async () => {
		mockApi.openInputDialog = vi.fn(async () => 'value');
		mockApi.setVariable = vi.fn();

		const complexPrompt = 'Please enter your API key (found in Settings > API)';
		await inputSkill.execute(mockApi, {
			prompt: complexPrompt,
			variable: 'apiKey'
		});

		expect(mockApi.openInputDialog).toHaveBeenCalledWith(complexPrompt);
	});

	it('should ignore extra parameters', async () => {
		mockApi.openInputDialog = vi.fn(async () => 'value');
		mockApi.setVariable = vi.fn();

		await inputSkill.execute(mockApi, {
			prompt: 'Enter value',
			variable: 'myVar',
			extraParam: 'ignored',
			anotherParam: '123'
		});

		expect(mockApi.setVariable).toHaveBeenCalledWith('myVar', 'value');
	});
});
