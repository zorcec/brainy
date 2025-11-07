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

import type * as vscode from 'vscode';
import type { AnnotationBlock } from '../parser';

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
 * Options for sending a request to the LLM.
 */
export interface SendRequestOptions {
	/**
	 * Optional list of tools available to the LLM.
	 * If not provided, all available tools from vscode.lm.tools will be used by default.
	 */
	tools?: vscode.LanguageModelChatTool[];
}

/**
 * API provided to skills for interacting with the VSCode extension.
 * Enables skills to send requests to LLM models, select chat models, and access available tools.
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
 * 
 * // Send a request with specific tools
 * const tools = await api.getAllAvailableTools();
 * const response = await api.sendRequest('user', 'What tools are available?', undefined, { tools });
 * 
 * // Send a request with all tools (default)
 * const response = await api.sendRequest('user', 'Help me with this task');
 * ```
 */
export interface SkillApi {
	/**
	 * Sends a request to the selected or specified model.
	 *
	 * @param role - Message role ('user', 'assistant', or 'agent').
	 *   'agent' is only for system messages and will throw if used for LLM requests.
	 * @param content - Message content
	 * @param modelId - Optional model ID override (e.g., 'gpt-4o', 'claude-3')
	 * @param options - Optional request options including tools
	 * @returns Promise resolving to response object with 'response' field
	 * @throws Error on timeout, provider failures, or if role is 'agent'
	 */
	sendRequest(
		role: 'user' | 'assistant' | 'agent',
		content: string,
		modelId?: string,
		options?: SendRequestOptions
	): Promise<{ response: string }>;

	/**
	 * Selects a chat model globally for subsequent requests.
	 * 
	 * @param modelId - Model ID to select (e.g., 'gpt-4o', 'claude-3')
	 * @returns Promise that resolves when the model is selected
	 */
	selectChatModel(modelId: string): Promise<void>;

	/**
	 * Gets all available tools from vscode.lm.tools.
	 * 
	 * @returns Promise resolving to an array of all available tools
	 */
	getAllAvailableTools(): Promise<vscode.LanguageModelChatTool[]>;

	/**
	 * Gets all parsed blocks from the current playbook.
	 * This includes annotations, plain text, comments, and code blocks.
	 * 
	 * @returns Array of all parsed blocks
	 */
	getParsedBlocks(): AnnotationBlock[];

	/**
	 * Gets the index of the currently executing block.
	 * This can be used by skills to determine context or access adjacent blocks.
	 * 
	 * @returns Zero-based index of the current block
	 */
	getCurrentBlockIndex(): number;

	/**
	 * Sets a variable value for use in playbook execution.
	 * Variable names are case-sensitive.
	 * 
	 * @param name - Variable name
	 * @param value - Variable value (must be a string)
	 */
	setVariable(name: string, value: string): void;

	/**
	 * Gets a variable value by name.
	 * Variable names are case-sensitive.
	 * 
	 * @param name - Variable name
	 * @returns Variable value, or undefined if not set
	 */
	getVariable(name: string): string | undefined;

	/**
	 * Opens an input dialog in VS Code and prompts the user for input.
	 * The execution pauses until the user provides input or cancels.
	 * 
	 * @param prompt - The prompt text to display to the user
	 * @returns Promise resolving to the user's input string
	 * @throws Error if the user cancels the input dialog
	 */
	openInputDialog(prompt: string): Promise<string>;

	/**
	 * Adds a message to the currently active contexts.
	 * If no contexts are active, the message is not stored.
	 * 
	 * @param role - Message role ('user', 'assistant', or 'agent')
	 * @param content - Message content
	 */
	addToContext(role: 'user' | 'assistant' | 'agent', content: string): void;

	/**
	 * Gets the current context (conversation history/messages) for the skill execution.
	 * Typically includes all user/assistant/agent messages so far.
	 *
	 * @returns Promise resolving to array of SkillMessage objects representing the context
	 */
	getContext(): Promise<SkillMessage[]>;

	/**
	 * Opens a file picker dialog for selecting files or folders.
	 * 
	 * @param options - File picker options (canSelectFiles, canSelectFolders, canSelectMany, filters)
	 * @returns Promise resolving to array of selected file URIs, or undefined if cancelled
	 */
	openFileDialog(options?: {
		canSelectFiles?: boolean;
		canSelectFolders?: boolean;
		canSelectMany?: boolean;
		filters?: Record<string, string[]>;
	}): Promise<vscode.Uri[] | undefined>;

	/**
	 * Opens an untitled text document for editing with optional initial content.
	 * Shows the document to the user and waits for them to finish editing.
	 * 
	 * @param content - Optional initial content for the document
	 * @param language - Optional language ID for syntax highlighting (default: 'markdown')
	 * @returns Promise resolving to the final document content
	 * @throws Error if the user cancels
	 */
	openTextDocument(content?: string, language?: string): Promise<string>;
}

/**
 * Parameter metadata for a skill.
 * Describes a single parameter that can be passed to a skill via flags.
 */
export interface SkillParameter {
	/**
	 * Parameter name (e.g., 'prompt', 'path', 'action')
	 */
	name: string;

	/**
	 * Description of what this parameter does
	 */
	description: string;

	/**
	 * Whether this parameter is required
	 * @default false
	 */
	required?: boolean;
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
 *   params: [
 *     { name: 'action', description: 'Action to perform (read|write|delete)', required: true },
 *     { name: 'path', description: 'File path', required: true },
 *     { name: 'content', description: 'File content for write action', required: false }
 *   ],
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
	 * Optional array of parameter definitions for this skill.
	 * Used for autocomplete, validation, and documentation.
	 * If not provided, no parameter suggestions will be shown in autocomplete.
	 */
	params?: SkillParameter[];

	/**
	 * Whether to register this skill as a VS Code Language Model tool.
	 * When true, the skill will be available to LLM calls via vscode.lm.registerTool().
	 * When false or undefined, the skill will not be registered as a tool.
	 * 
	 * @default false
	 */
	registerAsTool?: boolean;

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
