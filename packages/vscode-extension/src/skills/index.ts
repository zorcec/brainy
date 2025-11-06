/**
 * Module: skills/index.ts
 *
 * Description:
 *   Main entry point for the skills system.
 *   - Exports model selection and LLM request handling (selectChatModel, sendRequest)
 *   - Exports skill loading and execution (loadSkill, executeSkill, runSkill)
 *   - Exports skill scanning (getAvailableSkills, refreshSkills, isSkillAvailable)
 *   - Exports built-in skills registry
 *   - Exports core types (Skill, SkillParams)
 *
 * Usage:
 *   // Model selection and LLM requests
 *   import { selectChatModel, sendRequest } from './skills';
 *   selectChatModel('gpt-4o');
 *   const response = await sendRequest('user', 'Hello!');
 *   
 *   // Skill loading and execution
 *   import { loadSkill, executeSkill } from './skills';
 *   const skill = await loadSkill('file', workspaceUri);
 *   const result = await executeSkill(skill, { action: 'read', path: './test.txt' });
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
 * Default model ID (hardcoded).
 */
const defaultModel = 'gpt-4.1';

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

	// Get model from session or use hardcoded default
	const model = getSelectedModel() ?? defaultModel;

	// Send request
	return await clientSendRequest({
		model,
		role,
		content,
		timeoutMs: opts?.timeoutMs
	});
}

/**
 * Resets the skills system state. Used for testing.
 */
export function resetSkills(): void {
	resetSessionStore();
	resetModelClient();
}

// Re-export types for convenience
export type { ModelResponse, SendRequestParams } from './modelClient';
export type { Skill, SkillParams, SkillApi } from './types';

// Re-export skill API creation
export { createSkillApi } from './skillApi';

// Re-export skill loading and execution
export { loadSkill, executeSkill, runSkill, resetSkillLoader } from './skillLoader';

// Re-export skill scanning
export {
	getAvailableSkills,
	refreshSkills,
	isSkillAvailable,
	resetSkillScanner
} from './skillScanner';

// Re-export built-in skills registry
export {
	isBuiltInSkill,
	getBuiltInSkillNames,
	getAllBuiltInSkills
} from './built-in';

// Re-export skill parameters registry
export {
	registerSkill,
	registerSkills,
	getSkillParams,
	getAllSkillNames as getAllRegisteredSkillNames,
	clearRegistry as clearSkillParamsRegistry
} from './skillParamsRegistry';
