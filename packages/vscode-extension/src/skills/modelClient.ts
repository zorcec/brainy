/**
 * Module: skills/modelClient.ts
 *
 * Description:
 *   Model client for LLM provider calls with timeout and error normalization.
 *   Provides factory function to create client instances with configurable behavior.
 *
 * Usage:
 *   import { createModelClient } from './modelClient';
 *   const client = createModelClient({ defaultTimeoutMs: 8000 });
 *   const response = await client.sendRequest({
 *     modelId: 'gpt-4o',
 *     role: 'user',
 *     content: 'Hello!',
 *     timeoutMs: 5000
 *   });
 */

/**
 * Request parameters for sending a message to the model.
 */
export type SendRequestParams = {
	/** Model ID to use (e.g., 'gpt-4o', 'claude-3') */
	modelId: string;
	/** Role of the message sender */
	role: 'user' | 'assistant';
	/** Message content */
	content: string;
	/** Optional timeout in milliseconds (overrides default) */
	timeoutMs?: number;
};

/**
 * Response from the model.
 */
export type ModelResponse = {
	/** Normalized reply text from the model */
	reply: string;
	/** Raw response object from the provider */
	raw: unknown;
};

/**
 * Model client interface for sending requests to LLM providers.
 */
export type ModelClient = {
	/** Sends a request to the model and returns the response */
	sendRequest: (params: SendRequestParams) => Promise<ModelResponse>;
};

/**
 * Configuration options for creating a model client.
 */
export type ModelClientConfig = {
	/** Default timeout in milliseconds (default: 8000) */
	defaultTimeoutMs?: number;
	/** Optional custom provider implementation for testing */
	provider?: (params: SendRequestParams) => Promise<ModelResponse>;
};

/**
 * Creates a new model client instance.
 *
 * @param config - Optional configuration
 * @returns ModelClient instance
 */
export function createModelClient(config?: ModelClientConfig): ModelClient {
	const defaultTimeoutMs = config?.defaultTimeoutMs ?? 8000;
	const provider = config?.provider ?? defaultProvider;

	return {
		sendRequest: async (params: SendRequestParams): Promise<ModelResponse> => {
			const timeoutMs = params.timeoutMs ?? defaultTimeoutMs;

			try {
				const response = await withTimeout(
					provider(params),
					timeoutMs,
					`Request timed out after ${timeoutMs}ms`
				);
				return response;
			} catch (error) {
				// Preserve and rethrow original errors to keep upstream behavior and types.
				if (error instanceof Error) {
					throw error;
				}
				throw new Error(String(error));
			}
		}
	};
}

/**
 * Default provider implementation (placeholder).
 * In production, this would call the actual LLM provider API.
 *
 * @param params - Request parameters
 * @returns Model response
 */
async function defaultProvider(params: SendRequestParams): Promise<ModelResponse> {
	// Placeholder implementation
	// In production, this would make actual API calls to LLM providers
	return {
		reply: `Echo: ${params.content}`,
		raw: { model: params.modelId, role: params.role }
	};
}

/**
 * Wraps a promise with a timeout.
 *
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param message - Error message if timeout occurs
 * @returns Promise that rejects with TimeoutError if timeout is exceeded
 */
function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	message: string
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(message));
		}, timeoutMs);

		promise
			.then((result) => {
				clearTimeout(timer);
				resolve(result);
			})
			.catch((error) => {
				clearTimeout(timer);
				reject(error);
			});
	});
}



