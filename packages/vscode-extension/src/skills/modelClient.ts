/**
 * Module: skills/modelClient.ts
 *
 * Description:
 *   Singleton model client for LLM provider calls with timeout and error handling.
 *   Uses VS Code's Language Model API (vscode.lm) to send requests to GitHub Copilot.
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

import * as vscode from 'vscode';

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
 * Default provider implementation using VS Code's Language Model API.
 * Sends messages to GitHub Copilot using vscode.lm.selectChatModels().
 *
 * @param params - Request parameters
 * @returns Model response
 * @throws Error if no models are available or request fails
 */
async function defaultProvider(params: SendRequestParams): Promise<ModelResponse> {
	// Select chat models matching the requested model ID
	const models = await vscode.lm.selectChatModels({
		vendor: 'copilot',
		family: params.modelId || 'gpt-4o'
	});

	if (models.length === 0) {
		throw new Error(`No models available for ${params.modelId || 'default'}. Ensure GitHub Copilot is active.`);
	}

	// Use the first available model
	const model = models[0];

	// Build message array - VS Code LM API expects LanguageModelChatMessage objects
	const messages: vscode.LanguageModelChatMessage[] = [
		vscode.LanguageModelChatMessage.User(params.content)
	];

	// Send request and collect streamed response
	const requestOptions: vscode.LanguageModelChatRequestOptions = {
		justification: 'Brainy playbook execution'
	};

	// Add tools if provided
	if (params.tools && params.tools.length > 0) {
		requestOptions.tools = params.tools;
	}

	try {
		const response = await model.sendRequest(messages, requestOptions);
		
		// Collect streamed text
		let fullText = '';
		for await (const fragment of response.text) {
			fullText += fragment;
		}

		return {
			reply: fullText,
			raw: { model: model.id, vendor: model.vendor, family: model.family }
		};
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`LLM request failed: ${error.message}`);
		}
		throw new Error(`LLM request failed: ${String(error)}`);
	}
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



