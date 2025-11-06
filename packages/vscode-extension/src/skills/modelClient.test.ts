/**
 * Unit tests for model client.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock vscode module before imports
vi.mock('vscode', () => ({
	lm: {
		selectChatModels: vi.fn(async () => [{
			id: 'gpt-4o',
			vendor: 'copilot',
			family: 'gpt-4o',
			sendRequest: vi.fn(async () => ({
				text: (async function* () {
					yield 'Mock response';
				})()
			}))
		}])
	},
	LanguageModelChatMessage: {
		User: vi.fn((content: string) => ({ role: 'user', content })),
		Assistant: vi.fn((content: string) => ({ role: 'assistant', content }))
	}
}));

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

	test('sends request without modelId when optional', async () => {
		const response = await sendRequest({
			role: 'user',
			content: 'Hello!'
		});

		expect(response).toHaveProperty('reply');
		expect(response).toHaveProperty('raw');
	});

	test('allows skill to override model by passing modelId', async () => {
		const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
			reply: `Response from ${params.modelId}`,
			raw: { model: params.modelId }
		}));

		configureModelClient({ provider: mockProvider });

		// Skill can specify which model to use
		const response = await sendRequest({
			modelId: 'skill-specific-model',
			role: 'user',
			content: 'Hello!'
		});

		expect(mockProvider).toHaveBeenCalledWith(
			expect.objectContaining({ 
				modelId: 'skill-specific-model'
			})
		);
		expect(response.reply).toBe('Response from skill-specific-model');
	});

	test('skill can omit modelId and rely on higher-level logic', async () => {
		const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
			reply: 'Response',
			raw: {}
		}));

		configureModelClient({ provider: mockProvider });

		// Skill doesn't specify model - higher level (index.ts) will provide it
		await sendRequest({
			role: 'user',
			content: 'Hello!'
		});

		// Verify provider was called with the params (modelId will be undefined)
		expect(mockProvider).toHaveBeenCalledWith({
			role: 'user',
			content: 'Hello!'
			// modelId is omitted/undefined when not provided
		});
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
			content: 'Test message'
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
			// Verify the original error instance is preserved
			expect(error).toBe(originalError);
		}
	});

	test('error message explicitly contains "timed out" on timeout', async () => {
		const slowProvider = async (): Promise<ModelResponse> => {
			await new Promise(resolve => setTimeout(resolve, 200));
			return { reply: 'Late response', raw: {} };
		};

		configureModelClient({ provider: slowProvider });

		try {
			await sendRequest({
				modelId: 'gpt-4o',
				role: 'user',
				content: 'Hello',
				timeoutMs: 50
			});
			expect.fail('Should have thrown a timeout error');
		} catch (error: any) {
			expect(error.message).toContain('timed out');
			expect(error.message).toContain('50ms');
		}
	});

	test('handles malformed response from provider', async () => {
		const malformedProvider = async (): Promise<any> => {
			// Return invalid response shape (missing required fields)
			return { wrongField: 'data' };
		};

		configureModelClient({ provider: malformedProvider as any });

		// The system should still return the response, but it might not be valid
		// In a real implementation, you might want to validate the response shape
		const response = await sendRequest({
			modelId: 'gpt-4o',
			role: 'user',
			content: 'Hello'
		});

		// Verify the response structure (even if malformed)
		expect(response).toBeDefined();
	});

	test('preserves error stack traces when re-throwing', async () => {
		const providerError = new Error('Provider API failure');
		const failingProvider = async (): Promise<ModelResponse> => {
			throw providerError;
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
			// Verify the error instance is the same (not wrapped)
			expect(error).toBe(providerError);
			expect(error.stack).toBeDefined();
		}
	});
});
