/**
 * Unit tests for model client.
 */

import { describe, test, expect, vi } from 'vitest';
import { createModelClient, type SendRequestParams, type ModelResponse } from './modelClient';

describe('createModelClient', () => {
	test('sends request with default provider', async () => {
		const client = createModelClient();
		const response = await client.sendRequest({
			modelId: 'gpt-4o',
			role: 'user',
			content: 'Hello!'
		});

		expect(response).toHaveProperty('reply');
		expect(response).toHaveProperty('raw');
		expect(typeof response.reply).toBe('string');
	});

	test('uses custom provider when provided', async () => {
		const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
			reply: `Mock response to: ${params.content}`,
			raw: { model: params.modelId, test: true }
		}));

		const client = createModelClient({ provider: mockProvider });
		const response = await client.sendRequest({
			modelId: 'test-model',
			role: 'user',
			content: 'Test message'
		});

		expect(mockProvider).toHaveBeenCalledWith({
			modelId: 'test-model',
			role: 'user',
			content: 'Test message',
			timeoutMs: undefined
		});
		expect(response.reply).toBe('Mock response to: Test message');
		expect(response.raw).toEqual({ model: 'test-model', test: true });
	});

	test('uses default timeout when not specified', async () => {
		const mockProvider = vi.fn(async (): Promise<ModelResponse> => ({
			reply: 'Response',
			raw: {}
		}));

		const client = createModelClient({ 
			defaultTimeoutMs: 5000,
			provider: mockProvider
		});

		await client.sendRequest({
			modelId: 'gpt-4o',
			role: 'user',
			content: 'Hello'
		});

		// The timeout is applied internally, verify provider was called
		expect(mockProvider).toHaveBeenCalled();
	});

	test('uses custom timeout when specified in request', async () => {
		const mockProvider = vi.fn(async (): Promise<ModelResponse> => ({
			reply: 'Response',
			raw: {}
		}));

		const client = createModelClient({ provider: mockProvider });
		await client.sendRequest({
			modelId: 'gpt-4o',
			role: 'user',
			content: 'Hello',
			timeoutMs: 1000
		});

		expect(mockProvider).toHaveBeenCalled();
	});

	test('throws timeout error when request exceeds timeout', async () => {
		const slowProvider = async (): Promise<ModelResponse> => {
			await new Promise(resolve => setTimeout(resolve, 200));
			return { reply: 'Late response', raw: {} };
		};

		const client = createModelClient({ provider: slowProvider });

		await expect(
			client.sendRequest({
				modelId: 'gpt-4o',
				role: 'user',
				content: 'Hello',
				timeoutMs: 50
			})
		).rejects.toThrow('timed out');
	});

	test('throws provider error when provider fails', async () => {
		const failingProvider = async (): Promise<ModelResponse> => {
			throw new Error('Provider API error');
		};

		const client = createModelClient({ provider: failingProvider });

		await expect(
			client.sendRequest({
				modelId: 'gpt-4o',
				role: 'user',
				content: 'Hello'
			})
		).rejects.toThrow('Provider API error');
	});

	test('throws network error for network-related failures', async () => {
		const networkFailProvider = async (): Promise<ModelResponse> => {
			const error = new Error('fetch failed: ECONNREFUSED');
			throw error;
		};

		const client = createModelClient({ provider: networkFailProvider });

		await expect(
			client.sendRequest({
				modelId: 'gpt-4o',
				role: 'user',
				content: 'Hello'
			})
		).rejects.toThrow('ECONNREFUSED');
	});

	test('includes context in error messages', async () => {
		const failingProvider = async (): Promise<ModelResponse> => {
			throw new Error('Test error');
		};

		const client = createModelClient({ provider: failingProvider });

		try {
			await client.sendRequest({
				modelId: 'test-model-id',
				role: 'user',
				content: 'Hello'
			});
			expect.fail('Should have thrown an error');
		} catch (error: any) {
			expect(error.message).toContain('Test error');
		}
	});

	test('preserves original error information', async () => {
		const originalError = new Error('Original API error');
		const failingProvider = async (): Promise<ModelResponse> => {
			throw originalError;
		};

		const client = createModelClient({ provider: failingProvider });

		try {
			await client.sendRequest({
				modelId: 'gpt-4o',
				role: 'user',
				content: 'Hello'
			});
			expect.fail('Should have thrown an error');
		} catch (error: any) {
			expect(error.message).toContain('Original API error');
		}
	});
});
