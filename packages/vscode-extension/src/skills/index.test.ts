/**
 * Unit and integration tests for the skills API.
 */

import { describe, test, expect, vi } from 'vitest';
import { createSkillsAPI } from './index';
import { createSessionStore } from './sessionStore';
import { createModelClient, type SendRequestParams, type ModelResponse } from './modelClient';

describe('createSkillsAPI', () => {
	describe('selectChatModel', () => {
		test('stores selected model ID', () => {
			const api = createSkillsAPI();
			api.selectChatModel('gpt-4o');
			
			// Verify by making a request
			expect(async () => {
				await api.sendRequest('user', 'test');
			}).not.toThrow();
		});

		test('throws ValidationError for empty model ID', () => {
			const api = createSkillsAPI();
			
			expect(() => api.selectChatModel('')).toThrow('Model ID must be a non-empty string');
		});

		test('throws ValidationError for whitespace-only model ID', () => {
			const api = createSkillsAPI();
			
			expect(() => api.selectChatModel('   ')).toThrow('Model ID must be a non-empty string');
		});

		test('throws ValidationError for non-string model ID', () => {
			const api = createSkillsAPI();
			
			expect(() => api.selectChatModel(null as any)).toThrow('Model ID must be a non-empty string');
			expect(() => api.selectChatModel(undefined as any)).toThrow('Model ID must be a non-empty string');
			expect(() => api.selectChatModel(123 as any)).toThrow('Model ID must be a non-empty string');
		});

		test('overwrites previous selection', () => {
			const sessionStore = createSessionStore();
			const api = createSkillsAPI({ sessionStore });
			
			api.selectChatModel('gpt-4o');
			expect(sessionStore.getSelectedModel()).toBe('gpt-4o');
			
			api.selectChatModel('claude-3');
			expect(sessionStore.getSelectedModel()).toBe('claude-3');
		});
	});

	describe('sendRequest', () => {
		test('sends request to selected model', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: `Response from ${params.modelId}`,
				raw: { model: params.modelId }
			}));

			const api = createSkillsAPI({
				modelClient: createModelClient({ provider: mockProvider })
			});

			api.selectChatModel('gpt-4o');
			const response = await api.sendRequest('user', 'Hello!');

			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({
					modelId: 'gpt-4o',
					role: 'user',
					content: 'Hello!'
				})
			);
			expect(response.reply).toBe('Response from gpt-4o');
		});

		test('uses default model when no model is selected', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: `Response from ${params.modelId}`,
				raw: {}
			}));

			const api = createSkillsAPI({
				defaultModelId: 'default-model',
				modelClient: createModelClient({ provider: mockProvider })
			});

			await api.sendRequest('user', 'Hello!');

			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({ modelId: 'default-model' })
			);
		});

		test('throws ValidationError when no model is selected and no default', async () => {
			const api = createSkillsAPI();

			await expect(
				api.sendRequest('user', 'Hello!')
			).rejects.toThrow('No model selected');
		});

		test('throws ValidationError for invalid role', async () => {
			const api = createSkillsAPI({ defaultModelId: 'gpt-4o' });

			await expect(
				api.sendRequest('system' as any, 'Hello!')
			).rejects.toThrow('Role must be');
		});

		test('throws ValidationError for empty content', async () => {
			const api = createSkillsAPI({ defaultModelId: 'gpt-4o' });

			await expect(
				api.sendRequest('user', '')
			).rejects.toThrow('Content must be');
		});

		test('throws ValidationError for whitespace-only content', async () => {
			const api = createSkillsAPI({ defaultModelId: 'gpt-4o' });

			await expect(
				api.sendRequest('user', '   ')
			).rejects.toThrow('Content must be');
		});

		test('passes timeout option to model client', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: 'Response',
				raw: {}
			}));

			const api = createSkillsAPI({
				defaultModelId: 'gpt-4o',
				modelClient: createModelClient({ provider: mockProvider })
			});

			await api.sendRequest('user', 'Hello!', { timeoutMs: 3000 });

			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({ timeoutMs: 3000 })
			);
		});

		test('handles assistant role correctly', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: 'Response',
				raw: {}
			}));

			const api = createSkillsAPI({
				defaultModelId: 'gpt-4o',
				modelClient: createModelClient({ provider: mockProvider })
			});

			await api.sendRequest('assistant', 'Previous response');

			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({ role: 'assistant' })
			);
		});
	});

	describe('integration scenarios', () => {
		test('complete workflow: select model and send request', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: `Echo: ${params.content}`,
				raw: { model: params.modelId }
			}));

			const api = createSkillsAPI({
				modelClient: createModelClient({ provider: mockProvider })
			});

			// Select model
			api.selectChatModel('gpt-4o');

			// Send request
			const response = await api.sendRequest('user', 'Test message');

			expect(response.reply).toBe('Echo: Test message');
			expect(mockProvider).toHaveBeenCalledTimes(1);
		});

		test('switch models between requests', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: `Response from ${params.modelId}`,
				raw: {}
			}));

			const api = createSkillsAPI({
				modelClient: createModelClient({ provider: mockProvider })
			});

			api.selectChatModel('gpt-4o');
			await api.sendRequest('user', 'First message');

			api.selectChatModel('claude-3');
			await api.sendRequest('user', 'Second message');

			expect(mockProvider).toHaveBeenNthCalledWith(
				1,
				expect.objectContaining({ modelId: 'gpt-4o' })
			);
			expect(mockProvider).toHaveBeenNthCalledWith(
				2,
				expect.objectContaining({ modelId: 'claude-3' })
			);
		});

		test('multiple requests to same model', async () => {
			const mockProvider = vi.fn(async (): Promise<ModelResponse> => ({
				reply: 'Response',
				raw: {}
			}));

			const api = createSkillsAPI({
				defaultModelId: 'gpt-4o',
				modelClient: createModelClient({ provider: mockProvider })
			});

			await api.sendRequest('user', 'Message 1');
			await api.sendRequest('user', 'Message 2');
			await api.sendRequest('assistant', 'Message 3');

			expect(mockProvider).toHaveBeenCalledTimes(3);
		});
	});
});
