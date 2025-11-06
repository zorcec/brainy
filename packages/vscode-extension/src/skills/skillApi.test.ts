/**
 * Unit tests for skillApi module.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createSkillApi } from './skillApi';
import * as modelClient from './modelClient';
import * as sessionStore from './sessionStore';
import { resetState as resetContextState } from './built-in/context';

// Mock the dependencies
vi.mock('./modelClient', () => ({
	sendRequest: vi.fn()
}));

vi.mock('./sessionStore', () => ({
	setSelectedModel: vi.fn()
}));

// Mock vscode module
vi.mock('vscode', () => ({
	lm: {
		tools: []
	}
}));

describe('skillApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetContextState(); // Reset context state before each test
	});

	describe('createSkillApi', () => {
		test('creates an API object with sendRequest, selectChatModel, and getAllAvailableTools methods', () => {
			const api = createSkillApi();
			
			expect(api).toHaveProperty('sendRequest');
			expect(api).toHaveProperty('selectChatModel');
			expect(api).toHaveProperty('getAllAvailableTools');
			expect(typeof api.sendRequest).toBe('function');
			expect(typeof api.selectChatModel).toBe('function');
			expect(typeof api.getAllAvailableTools).toBe('function');
		});
	});

	describe('sendRequest', () => {
		test('calls modelClient.sendRequest with correct parameters', async () => {
			const mockResponse = { reply: 'Test response', raw: {} };
			vi.mocked(modelClient.sendRequest).mockResolvedValue(mockResponse);

			const api = createSkillApi();
			const result = await api.sendRequest('user', 'Test content', 'gpt-4o');

			expect(modelClient.sendRequest).toHaveBeenCalledWith({
				role: 'user',
				content: 'Test content',
				modelId: 'gpt-4o',
				context: []
			});
			expect(result).toEqual({ response: 'Test response' });
		});

		test('works without modelId parameter', async () => {
			const mockResponse = { reply: 'Test response', raw: {} };
			vi.mocked(modelClient.sendRequest).mockResolvedValue(mockResponse);

			const api = createSkillApi();
			const result = await api.sendRequest('user', 'Test content');

			expect(modelClient.sendRequest).toHaveBeenCalledWith({
				role: 'user',
				content: 'Test content',
				modelId: undefined,
				context: []
			});
			expect(result).toEqual({ response: 'Test response' });
		});

		test('throws error on modelClient failure', async () => {
			const error = new Error('Model client error');
			vi.mocked(modelClient.sendRequest).mockRejectedValue(error);

			const api = createSkillApi();
			
			await expect(
				api.sendRequest('user', 'Test content')
			).rejects.toThrow('Model client error');
		});

		test('works with assistant role', async () => {
			const mockResponse = { reply: 'Assistant response', raw: {} };
			vi.mocked(modelClient.sendRequest).mockResolvedValue(mockResponse);

			const api = createSkillApi();
			const result = await api.sendRequest('assistant', 'Assistant content');

			expect(modelClient.sendRequest).toHaveBeenCalledWith({
				role: 'assistant',
				content: 'Assistant content',
				modelId: undefined,
				context: []
			});
			expect(result).toEqual({ response: 'Assistant response' });
		});
	});

	describe('selectChatModel', () => {
		test('calls sessionStore.setSelectedModel with correct modelId', async () => {
			const api = createSkillApi();
			await api.selectChatModel('gpt-4o');

			expect(sessionStore.setSelectedModel).toHaveBeenCalledWith('gpt-4o');
		});

		test('works with different model IDs', async () => {
			const api = createSkillApi();
			
			await api.selectChatModel('claude-3');
			expect(sessionStore.setSelectedModel).toHaveBeenCalledWith('claude-3');

			await api.selectChatModel('gpt-4.1');
			expect(sessionStore.setSelectedModel).toHaveBeenCalledWith('gpt-4.1');
		});

		test('returns a resolved promise', async () => {
			const api = createSkillApi();
			const result = await api.selectChatModel('gpt-4o');

			expect(result).toBeUndefined();
		});
	});

	describe('API isolation', () => {
		test('each API instance is independent', async () => {
			const api1 = createSkillApi();
			const api2 = createSkillApi();

			await api1.selectChatModel('gpt-4o');
			await api2.selectChatModel('claude-3');

			// Both should set the same singleton state (last wins)
			expect(sessionStore.setSelectedModel).toHaveBeenCalledWith('gpt-4o');
			expect(sessionStore.setSelectedModel).toHaveBeenCalledWith('claude-3');
		});
	});

	describe('getContext', () => {
		test('returns empty array when no contexts selected', async () => {
			const api = createSkillApi();
			const context = await api.getContext();
			expect(context).toEqual([]);
		});

		test('returns messages from all selected contexts', async () => {
			// Import context functions
			const { selectContext, addMessageToContext, resetState } = await import('./built-in/context');
			
			// Reset state and setup contexts
			resetState();
			selectContext(['ctx1', 'ctx2']);
			addMessageToContext('ctx1', 'user', 'Hello from ctx1');
			addMessageToContext('ctx1', 'assistant', 'Response from ctx1');
			addMessageToContext('ctx2', 'user', 'Hello from ctx2');
			
			const api = createSkillApi();
			const context = await api.getContext();
			
			// Should return all messages from all selected contexts
			expect(context).toHaveLength(3);
			expect(context[0]).toEqual({ role: 'user', content: 'Hello from ctx1' });
			expect(context[1]).toEqual({ role: 'assistant', content: 'Response from ctx1' });
			expect(context[2]).toEqual({ role: 'user', content: 'Hello from ctx2' });
		});

		test('returns flattened messages in order of selected contexts', async () => {
			const { selectContext, addMessageToContext, resetState } = await import('./built-in/context');
			
			resetState();
			selectContext(['ctx2', 'ctx1']); // Note order: ctx2 first, then ctx1
			addMessageToContext('ctx1', 'user', 'Message 1');
			addMessageToContext('ctx2', 'user', 'Message 2');
			
			const api = createSkillApi();
			const context = await api.getContext();
			
			// Should return messages in order of selected contexts (ctx2, then ctx1)
			expect(context).toHaveLength(2);
			expect(context[0].content).toBe('Message 2'); // ctx2 first
			expect(context[1].content).toBe('Message 1'); // ctx1 second
		});
	});

	describe('getAllAvailableTools', () => {
		test('returns all available tools from vscode.lm.tools', async () => {
			const api = createSkillApi();
			const tools = await api.getAllAvailableTools();
			
			expect(Array.isArray(tools)).toBe(true);
			// In the mocked environment, tools will be an empty array
			expect(tools).toEqual([]);
		});

		test('returns tools as an array', async () => {
			const api = createSkillApi();
			const tools = await api.getAllAvailableTools();
			
			expect(tools).toBeInstanceOf(Array);
		});
	});

	describe('sendRequest with tools', () => {
		test('passes tools to modelClient.sendRequest', async () => {
			const mockResponse = { reply: 'Test response', raw: {} };
			vi.mocked(modelClient.sendRequest).mockResolvedValue(mockResponse);

			const mockTools = [{ name: 'tool1' } as any, { name: 'tool2' } as any];
			const api = createSkillApi();
			const result = await api.sendRequest('user', 'Test content', 'gpt-4o', { tools: mockTools });

			expect(modelClient.sendRequest).toHaveBeenCalledWith({
				role: 'user',
				content: 'Test content',
				modelId: 'gpt-4o',
				context: [],
				tools: mockTools
			});
			expect(result).toEqual({ response: 'Test response' });
		});

		test('works without tools parameter', async () => {
			const mockResponse = { reply: 'Test response', raw: {} };
			vi.mocked(modelClient.sendRequest).mockResolvedValue(mockResponse);

			const api = createSkillApi();
			const result = await api.sendRequest('user', 'Test content');

			expect(modelClient.sendRequest).toHaveBeenCalledWith({
				role: 'user',
				content: 'Test content',
				modelId: undefined,
				context: [],
				tools: undefined
			});
			expect(result).toEqual({ response: 'Test response' });
		});
	});
});
