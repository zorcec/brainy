/**
 * Module: skills/modelClient.ts
 *
 * Description:
 *   Singleton model client for LLM provider calls with timeout and error handling.
 *   Provides sendRequest function and configuration for timeout and custom providers.
 *
 * Usage:
 *   import { sendRequest, configureModelClient } from './modelClient';
 *   const response = await sendRequest({
 *     modelId: 'gpt-4o',
 *     role: 'user',
 *     content: 'Hello!',
 *     timeoutMs: 5000
 *   });
 */

import type * as vscode from 'vscode';

/**
 * Request parameters for sending a message to the model.
 */
export type SendRequestParams = {
	/** Optional model ID override (e.g., 'gpt-4o', 'claude-3'). If not provided, uses the selected or default model. */
	modelId?: string;
	/** Role of the message sender */
	role: 'user' | 'assistant';
	/** Message content */
	content: string;
	/** Optional timeout in milliseconds (overrides default) */
	timeoutMs?: number;
	/** Optional list of tools available to the LLM */
	tools?: vscode.LanguageModelChatTool[];
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
 * Provider function type for custom implementations.
 */
export type ProviderFunction = (params: SendRequestParams) => Promise<ModelResponse>;

/**
 * Singleton configuration state.
 */
let defaultTimeoutMs = 8000;
let providerFunction: ProviderFunction = defaultProvider;

/**
 * Configures the model client singleton.
 *
 * @param config - Configuration options
 * @param config.defaultTimeoutMs - Default timeout in milliseconds
 * @param config.provider - Custom provider implementation
 */
export function configureModelClient(config: {
	defaultTimeoutMs?: number;
	provider?: ProviderFunction;
}): void {
	if (config.defaultTimeoutMs !== undefined) {
		defaultTimeoutMs = config.defaultTimeoutMs;
	}
	if (config.provider !== undefined) {
		providerFunction = config.provider;
	}
}

/**
 * Resets the model client configuration. Used for testing.
 */
export function resetModelClient(): void {
	defaultTimeoutMs = 8000;
	providerFunction = defaultProvider;
}

/**
 * Sends a request to the model and returns the response.
 *
 * @param params - Request parameters
 * @returns Promise with model response
 * @throws Error for validation, timeout, or provider failures
 */
export async function sendRequest(params: SendRequestParams): Promise<ModelResponse> {
	const timeoutMs = params.timeoutMs ?? defaultTimeoutMs;

	try {
		const response = await withTimeout(
			providerFunction(params),
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
 * @returns Promise that rejects with Error if timeout is exceeded
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



