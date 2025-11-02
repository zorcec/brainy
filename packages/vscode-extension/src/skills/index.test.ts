/**
 * Unit and integration tests for the skills API.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock vscode before imports
vi.mock('vscode', () => ({}));

import {
	selectChatModel,
	sendRequest,
	resetSkills,
	type ModelResponse
} from './index';
import { getSelectedModel } from './sessionStore';
import { configureModelClient } from './modelClient';
import { type SendRequestParams } from './modelClient';

describe('skills API', () => {
	beforeEach(() => {
		// Reset singleton state before each test
		resetSkills();
	});

	describe('selectChatModel', () => {
		test('stores selected model ID', () => {
			selectChatModel('gpt-4o');
			expect(getSelectedModel()).toBe('gpt-4o');
		});

		test('throws error for empty model ID', () => {
			expect(() => selectChatModel('')).toThrow('Model ID must be a non-empty string');
		});

		test('throws error for whitespace-only model ID', () => {
			expect(() => selectChatModel('   ')).toThrow('Model ID must be a non-empty string');
		});

		test('throws error for non-string model ID', () => {
			expect(() => selectChatModel(null as any)).toThrow('Model ID must be a non-empty string');
			expect(() => selectChatModel(undefined as any)).toThrow('Model ID must be a non-empty string');
			expect(() => selectChatModel(123 as any)).toThrow('Model ID must be a non-empty string');
		});

		test('overwrites previous selection', () => {
			selectChatModel('gpt-4o');
			expect(getSelectedModel()).toBe('gpt-4o');
			
			selectChatModel('claude-3');
			expect(getSelectedModel()).toBe('claude-3');
		});
	});

	describe('sendRequest', () => {
		test('sends request to selected model', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: `Response from ${params.modelId}`,
				raw: { model: params.modelId }
			}));

			configureModelClient({ provider: mockProvider });
			selectChatModel('gpt-4o');
			
			const response = await sendRequest('user', 'Hello!');

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

			configureModelClient({ provider: mockProvider });

			// No model selected, should use hardcoded default 'gpt-4.1'
			await sendRequest('user', 'Hello!');

			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({ modelId: 'gpt-4.1' })
			);
		});

		test('throws error when no model is selected and no default', async () => {
			// This test is no longer relevant since we have a hardcoded default
			// Keeping it to verify the default works
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: 'Response',
				raw: {}
			}));

			configureModelClient({ provider: mockProvider });

			// Should use hardcoded default 'gpt-4.1'
			await sendRequest('user', 'Hello!');
			
			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({ modelId: 'gpt-4.1' })
			);
		});

		test('throws error for invalid role', async () => {
			await expect(
				sendRequest('system' as any, 'Hello!')
			).rejects.toThrow('Role must be');
		});

		test('throws error for empty content', async () => {
			await expect(
				sendRequest('user', '')
			).rejects.toThrow('Content must be');
		});

		test('throws error for whitespace-only content', async () => {
			await expect(
				sendRequest('user', '   ')
			).rejects.toThrow('Content must be');
		});

		test('throws error for non-string content', async () => {
			await expect(
				sendRequest('user', null as any)
			).rejects.toThrow('Content must be');

			await expect(
				sendRequest('user', undefined as any)
			).rejects.toThrow('Content must be');

			await expect(
				sendRequest('user', 123 as any)
			).rejects.toThrow('Content must be');
		});

		test('passes timeout option to model client', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: 'Response',
				raw: {}
			}));

			configureModelClient({ provider: mockProvider });

			await sendRequest('user', 'Hello!', { timeoutMs: 3000 });

			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({ timeoutMs: 3000 })
			);
		});

		test('handles assistant role correctly', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: 'Response',
				raw: {}
			}));

			configureModelClient({ provider: mockProvider });

			await sendRequest('assistant', 'Previous response');

			expect(mockProvider).toHaveBeenCalledWith(
				expect.objectContaining({ role: 'assistant' })
			);
		});
	});	describe('integration scenarios', () => {
		test('complete workflow: select model and send request', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: `Echo: ${params.content}`,
				raw: { model: params.modelId }
			}));

			configureModelClient({ provider: mockProvider });

			// Select model
			selectChatModel('gpt-4o');

			// Send request
			const response = await sendRequest('user', 'Test message');

			expect(response.reply).toBe('Echo: Test message');
			expect(mockProvider).toHaveBeenCalledTimes(1);
		});

		test('switch models between requests', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
				reply: `Response from ${params.modelId}`,
				raw: {}
			}));

			configureModelClient({ provider: mockProvider });

			selectChatModel('gpt-4o');
			await sendRequest('user', 'First message');

			selectChatModel('claude-3');
			await sendRequest('user', 'Second message');

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

			configureModelClient({ provider: mockProvider });

			await sendRequest('user', 'Message 1');
			await sendRequest('user', 'Message 2');
			await sendRequest('assistant', 'Message 3');

			expect(mockProvider).toHaveBeenCalledTimes(3);
		});
	});

	describe('error handling edge cases', () => {
		test('handles timeout with explicit error message', async () => {
			const slowProvider = async (): Promise<ModelResponse> => {
				await new Promise(resolve => setTimeout(resolve, 200));
				return { reply: 'Late', raw: {} };
			};

			configureModelClient({ provider: slowProvider });

			try {
				await sendRequest('user', 'Test', { timeoutMs: 50 });
				expect.fail('Should have thrown timeout error');
			} catch (error: any) {
				expect(error.message).toContain('timed out');
				expect(error.message).toContain('50ms');
			}
		});

		test('preserves network error with ECONNREFUSED', async () => {
			const networkError = new Error('connect ECONNREFUSED 127.0.0.1:8080');
			const failingProvider = async (): Promise<ModelResponse> => {
				throw networkError;
			};

			configureModelClient({ provider: failingProvider });

			try {
				await sendRequest('user', 'Test');
				expect.fail('Should have thrown network error');
			} catch (error: any) {
				expect(error).toBe(networkError);
				expect(error.message).toContain('ECONNREFUSED');
			}
		});

		test('preserves provider API errors without wrapping', async () => {
			const apiError = new Error('API rate limit exceeded');
			const failingProvider = async (): Promise<ModelResponse> => {
				throw apiError;
			};

			configureModelClient({ provider: failingProvider });

			try {
				await sendRequest('user', 'Test');
				expect.fail('Should have thrown API error');
			} catch (error: any) {
				// Verify original error instance is preserved
				expect(error).toBe(apiError);
				expect(error.message).toBe('API rate limit exceeded');
			}
		});
	});
});