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

describe('skillApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('createSkillApi', () => {
		test('creates an API object with sendRequest and selectChatModel methods', () => {
			const api = createSkillApi();
			
			expect(api).toHaveProperty('sendRequest');
			expect(api).toHaveProperty('selectChatModel');
			expect(typeof api.sendRequest).toBe('function');
			expect(typeof api.selectChatModel).toBe('function');
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
});
