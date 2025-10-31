/**
 * Module: skills/index.ts
 *
 * Description:
 *   Main entry point for the skills system. Provides API factory for injection into skill processes.
 *   This module does not export the API directly; instead, it provides a factory function that
 *   creates API instances with injected dependencies for testing and process isolation.
 *
 * Usage:
 *   import { createSkillsAPI } from './skills';
 *   const api = createSkillsAPI({ defaultModelId: 'gpt-4o' });
 *   await api.selectChatModel('claude-3');
 *   const response = await api.sendRequest('user', 'Hello!');
 */

import { createSessionStore, type SessionStore } from './sessionStore';
import { createModelClient, type ModelClient, type ModelResponse } from './modelClient';

/**
 * Configuration options for creating the skills API.
 */
export type SkillsAPIConfig = {
	/** Optional default model ID to use when none is selected */
	defaultModelId?: string;
	/** Optional default timeout in milliseconds (default: 8000) */
	defaultTimeoutMs?: number;
	/** Optional session store for testing */
	sessionStore?: SessionStore;
	/** Optional model client for testing */
	modelClient?: ModelClient;
};

/**
 * Skills API interface exposed to skill processes.
 */
export type SkillsAPI = {
	/** Selects the chat model to use for subsequent requests */
	selectChatModel: (modelId: string) => void;
	/** Sends a request to the selected (or default) model */
	sendRequest: (
		role: 'user' | 'assistant',
		content: string,
		opts?: { timeoutMs?: number }
	) => Promise<ModelResponse>;
};

/**
 * Creates a new skills API instance with injected dependencies.
 * This factory enables testing and process isolation.
 *
 * @param config - Optional configuration
 * @returns SkillsAPI instance
 */
export function createSkillsAPI(config?: SkillsAPIConfig): SkillsAPI {
	const sessionStore = config?.sessionStore ?? createSessionStore();
	const modelClient = config?.modelClient ?? createModelClient({
		defaultTimeoutMs: config?.defaultTimeoutMs
	});
	const defaultModelId = config?.defaultModelId;

	return {
		selectChatModel: (modelId: string) => {
			if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
				throw new Error('Model ID must be a non-empty string');
			}
			sessionStore.setSelectedModel(modelId);
		},

		sendRequest: async (
			role: 'user' | 'assistant',
			content: string,
			opts?: { timeoutMs?: number }
		): Promise<ModelResponse> => {
			// Validate role
			if (role !== 'user' && role !== 'assistant') {
				throw new Error('Role must be "user" or "assistant"');
			}

			// Validate content
			if (!content || typeof content !== 'string' || content.trim() === '') {
				throw new Error('Content must be a non-empty string');
			}

			// Get model ID from session or default
			const modelId = sessionStore.getSelectedModel() ?? defaultModelId;
			if (!modelId) {
				throw new Error('No model selected and no default model configured');
			}

			// Send request
			return await modelClient.sendRequest({
				modelId,
				role,
				content,
				timeoutMs: opts?.timeoutMs
			});
		}
	};
}

// Re-export types for convenience
export type { SessionStore } from './sessionStore';
export type { ModelClient, ModelResponse, SendRequestParams } from './modelClient';
