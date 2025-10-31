/**
 * Unit and integration tests for the skills API.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
	selectChatModel,
	sendRequest,
	configureSkills,
	resetSkills,
	type ModelResponse
} from './index';
import { getSelectedModel } from './sessionStore';
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

			configureSkills({ provider: mockProvider });
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

			configureSkills({
defaultModelId: 'default-model',
provider: mockProvider
});

			await sendRequest('user', 'Hello!');

			expect(mockProvider).toHaveBeenCalledWith(
expect.objectContaining({ modelId: 'default-model' })
);
		});

		test('throws error when no model is selected and no default', async () => {
			await expect(
sendRequest('user', 'Hello!')
).rejects.toThrow('No model selected');
		});

		test('throws error for invalid role', async () => {
			configureSkills({ defaultModelId: 'gpt-4o' });

			await expect(
sendRequest('system' as any, 'Hello!')
).rejects.toThrow('Role must be');
		});

		test('throws error for empty content', async () => {
			configureSkills({ defaultModelId: 'gpt-4o' });

			await expect(
sendRequest('user', '')
).rejects.toThrow('Content must be');
		});

		test('throws error for whitespace-only content', async () => {
			configureSkills({ defaultModelId: 'gpt-4o' });

			await expect(
sendRequest('user', '   ')
).rejects.toThrow('Content must be');
		});

		test('passes timeout option to model client', async () => {
			const mockProvider = vi.fn(async (params: SendRequestParams): Promise<ModelResponse> => ({
reply: 'Response',
raw: {}
}));

			configureSkills({
defaultModelId: 'gpt-4o',
provider: mockProvider
});

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

			configureSkills({
defaultModelId: 'gpt-4o',
provider: mockProvider
});

			await sendRequest('assistant', 'Previous response');

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

			configureSkills({ provider: mockProvider });

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

			configureSkills({ provider: mockProvider });

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

			configureSkills({
defaultModelId: 'gpt-4o',
provider: mockProvider
});

			await sendRequest('user', 'Message 1');
			await sendRequest('user', 'Message 2');
			await sendRequest('assistant', 'Message 3');

			expect(mockProvider).toHaveBeenCalledTimes(3);
		});
	});
});
