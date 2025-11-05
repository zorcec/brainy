/**
 * Unit tests for skillApi module.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createSkillApi } from './skillApi';
import * as modelClient from './modelClient';
import * as sessionStore from './sessionStore';

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
				modelId: 'gpt-4o'
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
				modelId: undefined
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
				modelId: undefined
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
		test('multiple API instances work independently', async () => {
			const mockResponse1 = { reply: 'Response 1', raw: {} };
			const mockResponse2 = { reply: 'Response 2', raw: {} };
			vi.mocked(modelClient.sendRequest)
				.mockResolvedValueOnce(mockResponse1)
				.mockResolvedValueOnce(mockResponse2);

			const api1 = createSkillApi();
			const api2 = createSkillApi();

			const result1 = await api1.sendRequest('user', 'Content 1');
			const result2 = await api2.sendRequest('user', 'Content 2');

			expect(result1).toEqual({ response: 'Response 1' });
			expect(result2).toEqual({ response: 'Response 2' });
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
				tools: undefined
			});
			expect(result).toEqual({ response: 'Test response' });
		});
	});
});
