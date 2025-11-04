/**
 * Module: skills/types.ts
 *
 * Description:
 *   Core type definitions for the Brainy Skills API.
 *   Defines the Skill interface that all skills must implement.
 *   Skills can be built-in (shipped with the extension) or project-specific (.brainy/skills).
 *
 * Usage:
 *   import { Skill, SkillParams, SkillApi } from './skills/types';
 *   
 *   export const mySkill: Skill = {
 *     name: 'my-skill',
 *     description: 'Does something useful',
 *     async execute(api, params) {
 *       const response = await api.sendRequest('user', 'Hello!', 'gpt-4o');
 *       return response.response;
 *     }
 *   };
 */

/**
 * Parameters passed to skill execution.
 * Flags from annotations are translated into this object.
 * Example: @file --action "read" --path "./test.json"
 * Results in: { action: "read", path: "./test.json" }
 */
export type SkillParams = Record<string, string | undefined>;

/**
 * Message structure for skill results.
 * Matches the context message format for consistency.
 */
export interface SkillMessage {
	role: 'user' | 'assistant' | 'agent';
	content: string;
}

/**
 * Result object returned by skill execution.
 * Skills must return an object with a messages array.
 */
export interface SkillResult {
	/**
	 * Array of messages produced by the skill.
	 * Each message has a role ('user' or 'assistant') and content.
	 */
	messages: SkillMessage[];
}

/**
 * API provided to skills for interacting with the VSCode extension.
 * Enables skills to send requests to LLM models and select chat models.
 * 
 * IMPORTANT: When modifying this interface, update the mock implementation in testUtils.ts
 * to ensure all built-in skill tests remain in sync. See createMockSkillApi() in testUtils.ts.
 * 
 * @example
 * ```ts
 * // Select a model globally
 * await api.selectChatModel('gpt-4o');
 * 
 * // Send a request
 * const response = await api.sendRequest('user', 'Summarize this text');
 * console.log(response.response);
 * ```
 */
export interface SkillApi {
	/**
	 * Sends a request to the selected or specified model.
	 * 
	 * @param role - Message role ('user' or 'assistant')
	 * @param content - Message content
	 * @param modelId - Optional model ID override (e.g., 'gpt-4o', 'claude-3')
	 * @returns Promise resolving to response object with 'response' field
	 * @throws Error on timeout or provider failures
	 */
	sendRequest(role: 'user' | 'assistant', content: string, modelId?: string): Promise<{ response: string }>;

	/**
	 * Selects a chat model globally for subsequent requests.
	 * 
	 * @param modelId - Model ID to select (e.g., 'gpt-4o', 'claude-3')
	 * @returns Promise that resolves when the model is selected
	 */
	selectChatModel(modelId: string): Promise<void>;
}

/**
 * Skill interface that all skills must implement.
 * 
 * Skills are modular, async functions that can be invoked from markdown playbooks.
 * Each skill has a unique name (derived from filename), a description, and an execute function.
 * The execute function receives a SkillApi object for interacting with the extension and model APIs.
 * 
 * @example
 * ```ts
 * export const fileSkill: Skill = {
 *   name: 'file',
 *   description: 'Read, write and delete files.',
 *   async execute(api, params) {
 *     const { action, path, content } = params;
 *     // Implementation logic here
 *     return '<result>';
 *   }
 * };
 * ```
 */
export interface Skill {
	/**
	 * Unique skill identifier.
	 * Typically derived from the filename (e.g., 'file' from file.ts).
	 */
	name: string;

	/**
	 * Brief description of what the skill does.
	 * Used for documentation and UI tooltips.
	 */
	description: string;

	/**
	 * Executes the skill with the provided API and parameters.
	 * 
	 * @param api - API object for interacting with VSCode extension and models
	 * @param params - Parameters from annotation flags (e.g., { action: 'read', path: './file.txt' })
	 * @returns Promise resolving to a SkillResult object with messages array
	 * @throws Error on failure (exception message will be shown in UI)
	 */
	execute(api: SkillApi, params: SkillParams): Promise<SkillResult>;
}
