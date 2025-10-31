/**
 * Unit tests for model client.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
	sendRequest,
	configureModelClient,
	resetModelClient,
	type SendRequestParams,
	type ModelResponse
} from './modelClient';

describe('modelClient', () => {
	beforeEach(() => {
		// Reset singleton state before each test
		resetModelClient();
	});

	test('sends request with default provider', async () => {
		const response = await sendRequest({
			modelId: 'gpt-4o',
			role: 'user',
			content: 'Hello!'
		});

		expect(response).toHaveProperty('reply');
		expect(response).toHaveProperty('raw');
		expect(typeof response.reply).toBe('string');
	});

	test('uses custom provider when configured', async () => {
		const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
			reply: `Mock response to: ${params.content}`,
			raw: { model: params.modelId, test: true }
		}));

		configureModelClient({ provider: mockProvider });

		const response = await sendRequest({
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

		configureModelClient({
			defaultTimeoutMs: 5000,
			provider: mockProvider
		});

		await sendRequest({
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

		configureModelClient({ provider: mockProvider });

		await sendRequest({
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

		configureModelClient({ provider: slowProvider });

		await expect(
			sendRequest({
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

		configureModelClient({ provider: failingProvider });

		await expect(
			sendRequest({
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

		configureModelClient({ provider: networkFailProvider });

		await expect(
			sendRequest({
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

		configureModelClient({ provider: failingProvider });

		try {
			await sendRequest({
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

		configureModelClient({ provider: failingProvider });

		try {
			await sendRequest({
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
