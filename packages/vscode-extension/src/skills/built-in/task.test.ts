/**
 * Unit tests for task skill.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { taskSkill } from './task';
import { createMockSkillApi } from '../testUtils';
import type { SkillApi } from '../types';

describe('taskSkill', () => {
	let mockApi: SkillApi;

	beforeEach(() => {
		mockApi = createMockSkillApi();
	});

	test('has correct name and description', () => {
		expect(taskSkill.name).toBe('task');
		expect(taskSkill.description).toContain('Send a prompt to the LLM');
	});

	test('sends prompt to LLM and returns assistant message', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Summarize this text'
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('assistant');
		expect(result.messages[0].content).toBe('Mock response for: Summarize this text');
	});

	test('sends prompt with model parameter', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Analyze the code',
			model: 'gpt-4o'
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('assistant');
		expect(result.messages[0].content).toBe('Mock response for: Analyze the code');
	});

	test('uses globally selected model when model not provided', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Hello world'
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].content).toBe('Mock response for: Hello world');
	});

	test('throws error for missing prompt', async () => {
		await expect(taskSkill.execute(mockApi, {})).rejects.toThrow('Missing or invalid prompt');
	});

	test('throws error for empty prompt', async () => {
		await expect(taskSkill.execute(mockApi, { prompt: '' })).rejects.toThrow('Missing or invalid prompt');
	});

	test('throws error for whitespace-only prompt', async () => {
		await expect(taskSkill.execute(mockApi, { prompt: '   ' })).rejects.toThrow('Missing or invalid prompt');
	});

	test('throws error for non-string prompt', async () => {
		await expect(taskSkill.execute(mockApi, { prompt: 123 as any })).rejects.toThrow('Missing or invalid prompt');
	});

	test('surfaces LLM errors directly', async () => {
		const errorApi: SkillApi = {
			async sendRequest() {
				throw new Error('LLM timeout');
			},
			async selectChatModel() {}
		};

		await expect(taskSkill.execute(errorApi, { prompt: 'Test' })).rejects.toThrow('LLM timeout');
	});

	test('surfaces validation errors from SkillApi', async () => {
		const errorApi: SkillApi = {
			async sendRequest() {
				throw new Error('Invalid model ID');
			},
			async selectChatModel() {}
		};

		await expect(taskSkill.execute(errorApi, { prompt: 'Test', model: 'invalid' })).rejects.toThrow('Invalid model ID');
	});

	test('handles complex prompts with special characters', async () => {
		const complexPrompt = 'Analyze this code:\n\nfunction test() {\n  return "Hello, world!";\n}';
		const result = await taskSkill.execute(mockApi, {
			prompt: complexPrompt
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('assistant');
		expect(result.messages[0].content).toContain('Mock response for:');
	});

	test('handles long prompts', async () => {
		const longPrompt = 'A'.repeat(10000);
		const result = await taskSkill.execute(mockApi, {
			prompt: longPrompt
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].role).toBe('assistant');
	});

	test('ignores extra parameters', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Test',
			extraParam: 'ignored',
			anotherParam: '123'
		});

		expect(result.messages).toHaveLength(1);
		expect(result.messages[0].content).toBe('Mock response for: Test');
	});
});
