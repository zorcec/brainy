/**
 * Module: skills/index.ts
 *
 * Description:
 *   Main entry point for the skills system. Provides singleton API for model selection
 *   and LLM request handling. Exports selectChatModel and sendRequest functions directly.
 *
 * Usage:
 *   import { selectChatModel, sendRequest } from './skills';
 *   selectChatModel('gpt-4o');
 *   const response = await sendRequest('user', 'Hello!');
 */

import {
	getSelectedModel,
	setSelectedModel as storeSetSelectedModel,
	resetSessionStore
} from './sessionStore';
import {
	sendRequest as clientSendRequest,
	configureModelClient,
	resetModelClient,
	type ModelResponse
} from './modelClient';

/**
 * Configuration state for default model.
 */
let defaultModelId: string | undefined = undefined;

/**
 * Selects the chat model to use for subsequent requests.
 *
 * @param modelId - Model identifier (e.g., 'gpt-4o', 'claude-3')
 * @throws Error if modelId is empty, whitespace-only, or not a string
 */
export function selectChatModel(modelId: string): void {
	if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
		throw new Error('Model ID must be a non-empty string');
	}
	storeSetSelectedModel(modelId);
}

/**
 * Sends a request to the selected (or default) model.
 *
 * @param role - Message role: 'user' or 'assistant'
 * @param content - Message content (non-empty string)
 * @param opts - Optional configuration
 * @param opts.timeoutMs - Optional timeout override in milliseconds
 * @returns Promise with model response containing reply and raw data
 * @throws Error for invalid parameters, missing model, timeout, or provider failures
 */
export async function sendRequest(
	role: 'user' | 'assistant',
	content: string,
	opts?: { timeoutMs?: number }
): Promise<ModelResponse> {
	// Validate role
	if (role !== 'user' && role !== 'assistant') {
		throw new Error('Role must be "user" or "assistant"');
	}

	// Validate content
	if (!content || typeof content !== 'string' || content.trim() === '') {
		throw new Error('Content must be a non-empty string');
	}

	// Get model ID from session or default
	const modelId = getSelectedModel() ?? defaultModelId;
	if (!modelId) {
		throw new Error('No model selected and no default model configured');
	}

	// Send request
	return await clientSendRequest({
		modelId,
		role,
		content,
		timeoutMs: opts?.timeoutMs
	});
}

/**
 * Configures the skills system. Used for setting defaults and testing.
 *
 * @param config - Configuration options
 * @param config.defaultModelId - Default model to use when none is selected
 * @param config.defaultTimeoutMs - Default timeout in milliseconds
 * @param config.provider - Custom provider implementation for testing
 */
export function configureSkills(config: {
	defaultModelId?: string;
	defaultTimeoutMs?: number;
	provider?: (params: any) => Promise<ModelResponse>;
}): void {
	if (config.defaultModelId !== undefined) {
		defaultModelId = config.defaultModelId;
	}
	if (config.defaultTimeoutMs !== undefined || config.provider !== undefined) {
		configureModelClient({
			defaultTimeoutMs: config.defaultTimeoutMs,
			provider: config.provider
		});
	}
}

/**
 * Resets the skills system state. Used for testing.
 */
export function resetSkills(): void {
	defaultModelId = undefined;
	resetSessionStore();
	resetModelClient();
}

// Re-export types for convenience
export type { ModelResponse, SendRequestParams } from './modelClient';
