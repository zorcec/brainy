/**
 * Unit tests for task skill.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock vscode module before imports
vi.mock('vscode', () => ({
	lm: {
		selectChatModels: vi.fn(async () => [{
			id: 'gpt-4o',
			vendor: 'copilot',
			family: 'gpt-4o',
			maxInputTokens: 128000,
			countTokens: vi.fn((text: string) => Promise.resolve(Math.ceil(text.length / 4)))
		}])
	}
}));

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

	test('sends prompt to LLM and returns user + assistant messages', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Summarize this text'
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[0].content).toBe('Summarize this text');
		expect(result.messages[1].role).toBe('assistant');
		expect(result.messages[1].content).toBe('Mock response for: Summarize this text');
	});

	test('sends prompt with model parameter', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Analyze the code',
			model: 'gpt-4o'
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[0].content).toBe('Analyze the code');
		expect(result.messages[1].role).toBe('assistant');
		expect(result.messages[1].content).toBe('Mock response for: Analyze the code');
	});

	test('uses globally selected model when model not provided', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Hello world'
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[1].content).toBe('Mock response for: Hello world');
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
			async selectChatModel() {},
			async getAllAvailableTools() {
				return [];
			},
			getParsedBlocks() { return []; },
			getCurrentBlockIndex() { return 0; },
			setVariable() {},
			getVariable() { return undefined; },
			async openInputDialog() { return 'test'; },
			addToContext() {},
			async getContext() { return []; },
			async openFileDialog() { return undefined; },
			async openTextDocument() { return ''; }
		};

		await expect(taskSkill.execute(errorApi, { prompt: 'Test' })).rejects.toThrow('LLM timeout');
	});

	test('surfaces validation errors from SkillApi', async () => {
		const errorApi: SkillApi = {
			async sendRequest() {
				throw new Error('Invalid model ID');
			},
			async selectChatModel() {},
			async getAllAvailableTools() {
				return [];
			},
			getParsedBlocks() { return []; },
			getCurrentBlockIndex() { return 0; },
			setVariable() {},
			getVariable() { return undefined; },
			async openInputDialog() { return 'test'; },
			addToContext() {},
			async getContext() { return []; },
			async openFileDialog() { return undefined; },
			async openTextDocument() { return ''; }
		};

		await expect(taskSkill.execute(errorApi, { prompt: 'Test', model: 'invalid' })).rejects.toThrow('Invalid model ID');
	});

	test('handles complex prompts with special characters', async () => {
		const complexPrompt = 'Analyze this code:\n\nfunction test() {\n  return "Hello, world!";\n}';
		const result = await taskSkill.execute(mockApi, {
			prompt: complexPrompt
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[1].role).toBe('assistant');
		expect(result.messages[1].content).toContain('Mock response for:');
	});

	test('handles long prompts', async () => {
		const longPrompt = 'A'.repeat(10000);
		const result = await taskSkill.execute(mockApi, {
			prompt: longPrompt
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[1].role).toBe('assistant');
	});

	test('ignores extra parameters', async () => {
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Test',
			extraParam: 'ignored',
			anotherParam: '123'
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[1].content).toBe('Mock response for: Test');
	});

	test('automatically uses all available tools', async () => {
		const mockTools = [
			{ name: 'tool1' } as any,
			{ name: 'tool2' } as any
		];
		mockApi.getAllAvailableTools = vi.fn(async () => mockTools);

		await taskSkill.execute(mockApi, {
			prompt: 'Test with tools'
		});

		// Verify that getAllAvailableTools was called
		expect(mockApi.getAllAvailableTools).toHaveBeenCalled();

		// Verify that sendRequest was called with the tools
		expect(mockApi.sendRequest).toHaveBeenCalledWith(
			'user',
			'Test with tools',
			undefined,
			{ tools: mockTools }
		);
	});

	test('substitutes variables in prompt', async () => {
		mockApi.getVariable = vi.fn((name) => {
			if (name === 'userName') return 'John';
			if (name === 'age') return '25';
			return undefined;
		});

		await taskSkill.execute(mockApi, {
			prompt: 'Hello, {{userName}}! You are {{age}} years old.'
		});

		expect(mockApi.sendRequest).toHaveBeenCalledWith(
			'user',
			'Hello, John! You are 25 years old.',
			undefined,
			expect.any(Object)
		);
	});

	test('replaces undefined variables with empty string', async () => {
		mockApi.getVariable = vi.fn(() => undefined);

		await taskSkill.execute(mockApi, {
			prompt: 'Hello, {{userName}}!'
		});

		expect(mockApi.sendRequest).toHaveBeenCalledWith(
			'user',
			'Hello, !',
			undefined,
			expect.any(Object)
		);
	});

	test('stores response in variable when variable parameter is provided', async () => {
		const mockSetVariable = vi.fn();
		mockApi.setVariable = mockSetVariable;
		mockApi.sendRequest = vi.fn(async () => ({ response: 'Test response' }));

		await taskSkill.execute(mockApi, {
			prompt: 'Test',
			variable: 'myVar'
		});

		expect(mockSetVariable).toHaveBeenCalledWith('myVar', 'Test response');
	});

	test('does not store response if variable parameter is not provided', async () => {
		const mockSetVariable = vi.fn();
		mockApi.setVariable = mockSetVariable;

		await taskSkill.execute(mockApi, {
			prompt: 'Test'
		});

		expect(mockSetVariable).not.toHaveBeenCalled();
	});

	test('does not store response if variable parameter is empty', async () => {
		const mockSetVariable = vi.fn();
		mockApi.setVariable = mockSetVariable;

		await taskSkill.execute(mockApi, {
			prompt: 'Test',
			variable: '   '
		});

		expect(mockSetVariable).not.toHaveBeenCalled();
	});

	test('substitutes variables and stores response simultaneously', async () => {
		mockApi.getVariable = vi.fn((name) => {
			if (name === 'userName') return 'Alice';
			return undefined;
		});
		mockApi.setVariable = vi.fn();
		mockApi.sendRequest = vi.fn(async () => ({ response: 'Hello Alice!' }));

		await taskSkill.execute(mockApi, {
			prompt: 'Greet {{userName}}',
			variable: 'greeting'
		});

		// Verify substitution happened
		expect(mockApi.sendRequest).toHaveBeenCalledWith(
			'user',
			'Greet Alice',
			undefined,
			expect.any(Object)
		);

		// Verify variable was stored
		expect(mockApi.setVariable).toHaveBeenCalledWith('greeting', 'Hello Alice!');
	});

	test('handles multiple variable substitutions in single prompt', async () => {
		mockApi.getVariable = vi.fn((name) => {
			const vars: Record<string, string> = {
				firstName: 'John',
				lastName: 'Doe',
				city: 'New York'
			};
			return vars[name];
		});

		await taskSkill.execute(mockApi, {
			prompt: 'User {{firstName}} {{lastName}} lives in {{city}}.'
		});

		expect(mockApi.sendRequest).toHaveBeenCalledWith(
			'user',
			'User John Doe lives in New York.',
			undefined,
			expect.any(Object)
		);
	});

	test('variable names are case-sensitive', async () => {
		mockApi.getVariable = vi.fn((name) => {
			if (name === 'userName') return 'lowercase';
			if (name === 'UserName') return 'PascalCase';
			if (name === 'USERNAME') return 'UPPERCASE';
			return undefined;
		});

		await taskSkill.execute(mockApi, {
			prompt: '{{userName}} {{UserName}} {{USERNAME}}'
		});

		expect(mockApi.sendRequest).toHaveBeenCalledWith(
			'user',
			'lowercase PascalCase UPPERCASE',
			undefined,
			expect.any(Object)
		);
	});

	test('uses empty tools array when no tools are available', async () => {
		mockApi.getAllAvailableTools = vi.fn(async () => []);

		await taskSkill.execute(mockApi, {
			prompt: 'Test without tools'
		});

		// Verify that sendRequest was called with empty tools array
		expect(mockApi.sendRequest).toHaveBeenCalledWith(
			'user',
			'Test without tools',
			undefined,
			{ tools: [] }
		);
	});

	test('debug mode dumps context without calling LLM', async () => {
		// Add some messages to context
		const { selectContext, addMessageToContext, resetState, getContext } = await import('./context');
		resetState();
		selectContext('test-context');
		addMessageToContext('test-context', 'user', 'Previous message 1');
		addMessageToContext('test-context', 'assistant', 'Previous message 2');

		// Override mockApi.getContext to use real context
		mockApi.getContext = vi.fn(async () => {
			const ctx = await getContext();
			return ctx ? ctx.messages : [];
		});

		const result = await taskSkill.execute(mockApi, {
			prompt: 'Test prompt',
			debug: ''  // Any value enables debug mode
		});

		// Should not call sendRequest
		expect(mockApi.sendRequest).not.toHaveBeenCalled();

		// Should return two messages
		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[1].role).toBe('agent');
		expect(result.messages[1].content).toContain('Debug mode: dumped context');

		// The first message should contain serialized JSON
		const contextJson = result.messages[0].content;
		expect(contextJson).toContain('Test prompt');
		expect(contextJson).toContain('Previous message 1');
		expect(contextJson).toContain('Previous message 2');

		// Clean up
		resetState();
	});

	test('debug mode handles circular references without error', async () => {
		// Create a context with potential circular reference issues
		const { selectContext, resetState } = await import('./context');
		resetState();
		selectContext('test-context');

		// Try to execute debug mode - should not throw
		const result = await taskSkill.execute(mockApi, {
			prompt: 'Test prompt',
			debug: 'true'
		});

		expect(result.messages).toHaveLength(2);
		expect(result.messages[0].role).toBe('user');
		expect(result.messages[1].role).toBe('agent');

		// Should be valid JSON string
		expect(() => JSON.parse(result.messages[0].content)).not.toThrow();

		// Clean up
		resetState();
	});

	test('debug mode truncates long strings', async () => {
		const { selectContext, addMessageToContext, resetState, getContext } = await import('./context');
		resetState();
		selectContext('test-context');
		
		// Add a very long message
		const longContent = 'x'.repeat(1000);
		addMessageToContext('test-context', 'user', longContent);

		// Override mockApi.getContext to use real context
		mockApi.getContext = vi.fn(async () => {
			const ctx = await getContext();
			return ctx ? ctx.messages : [];
		});

		const result = await taskSkill.execute(mockApi, {
			prompt: 'Test prompt',
			debug: ''
		});

		const contextJson = result.messages[0].content;
		
		// Should contain truncation marker
		expect(contextJson).toContain('[truncated]');

		// Clean up
		resetState();
	});
});

