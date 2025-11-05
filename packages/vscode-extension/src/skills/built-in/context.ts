/**
 * Module: skills/built-in/context.ts
 *
 * Description:
 *   Built-in context manipulation skill for Brainy.
 *   Allows users to switch to or create named agent contexts within playbooks.
 *   Contexts are tracked in memory for the session and messages are stored
 *   in chronological order with role and content for LLM API compatibility.
 *   Enforces model-specific token limits and automatically truncates contexts
 *   by removing oldest messages first (FIFO) when limits are exceeded.
 *
 * Usage in playbooks:
 *   @context --name "research"
 *   @context --names "research,summary"
 *
 * Parameters:
 *   - name: Single context name (string)
 *   - names: Multiple context names (comma-separated string)
 *
 * Context Structure:
 *   Each context stores an array of message objects:
 *   [{ role: 'user' | 'assistant', content: string }, ...]
 *
 * Token Limits:
 *   Each model has a hardcoded input token limit. When a context exceeds the limit,
 *   the oldest messages are removed until the context is under the limit.
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';
import { isValidString } from '../validation';

/**
 * Model-specific input token limits.
 * These are hardcoded based on known model specifications.
 */
const MODEL_TOKEN_LIMITS: Record<string, number> = {
	'gpt-4': 8192,
	'gpt-4-32k': 32768,
	'gpt-4o': 128000,
	'gpt-4o-mini': 128000,
	'claude-3': 200000,
	'claude-3-opus': 200000,
	'claude-3-sonnet': 200000,
	'claude-3-haiku': 200000,
	'claude-3.5': 200000,
	'claude-3.5-sonnet': 200000,
};

/**
 * Default token limit if model is not recognized.
 */
const DEFAULT_TOKEN_LIMIT = 8192;

/**
 * Message structure for context tracking.
 * Matches VS Code LLM API requirements.
 */
export type ContextMessage = {
	role: 'user' | 'assistant';
	content: string;
};

/**
 * Context data structure.
 */
export type Context = {
	name: string;
	messages: ContextMessage[];
};

/**
 * In-memory store for all contexts.
 * Key is context name, value is array of messages.
 */
const contextStore = new Map<string, ContextMessage[]>();

/**
 * Currently selected context names for the session.
 */
let selectedContextNames: string[] = [];

/**
 * Currently selected model ID for token limit enforcement.
 */
let currentModelId: string | undefined;

/**
 * Callback function to show warnings to the user.
 */
let warningCallback: ((message: string) => void) | undefined;

/**
 * Estimates the number of tokens in a text string.
 * Uses a simple heuristic: ~4 characters per token for English text.
 * 
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

/**
 * Gets the token limit for the current model.
 * 
 * @returns Token limit for current model or default limit
 */
function getModelTokenLimit(): number {
	if (!currentModelId) {
		return DEFAULT_TOKEN_LIMIT;
	}
	return MODEL_TOKEN_LIMITS[currentModelId] || DEFAULT_TOKEN_LIMIT;
}

/**
 * Counts total tokens in an array of messages.
 * 
 * @param messages - Array of messages
 * @returns Total estimated token count
 */
function countMessagesTokens(messages: ContextMessage[]): number {
	return messages.reduce((total, msg) => total + estimateTokens(msg.content), 0);
}

/**
 * Truncates messages by removing oldest first until under token limit.
 * Shows a warning if any messages were removed.
 * 
 * @param messages - Array of messages to truncate
 * @param contextName - Name of the context (for warning message)
 * @returns Truncated array of messages
 */
function truncateMessages(messages: ContextMessage[], contextName: string): ContextMessage[] {
	const limit = getModelTokenLimit();
	let totalTokens = countMessagesTokens(messages);
	
	if (totalTokens <= limit) {
		return messages;
	}
	
	// Create a copy to avoid mutating original
	const truncated = [...messages];
	let removedCount = 0;
	
	// Remove oldest messages first (FIFO) until under limit
	while (totalTokens > limit && truncated.length > 0) {
		const removed = truncated.shift();
		if (removed) {
			totalTokens -= estimateTokens(removed.content);
			removedCount++;
		}
	}
	
	// Show warning if truncation occurred
	if (removedCount > 0 && warningCallback) {
		const modelInfo = currentModelId ? ` for model ${currentModelId}` : '';
		warningCallback(
			`Context "${contextName}" exceeded token limit${modelInfo} (${limit} tokens). ` +
			`Removed ${removedCount} oldest message${removedCount > 1 ? 's' : ''}.`
		);
	}
	
	return truncated;
}

/**
 * Context skill implementation.
 * Selects one or more agent contexts for the session.
 */
export const contextSkill: Skill = {
	name: 'context',
	description: 'Select one or more agent contexts for the session.',
	params: [
		{ name: 'name', description: 'Single context name', required: false },
		{ name: 'names', description: 'Multiple context names (comma-separated)', required: false }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		// Extract context names from params
		// Support both --name "single" and --names "name1,name2,name3"
		const { name, names } = params;
		
		let nameList: string[];
		
		if (names !== undefined) {
			// Multiple names provided as comma-separated string
			if (!isValidString(names)) {
				throw new Error('Missing or invalid context name(s)');
			}
			nameList = names.split(',').map(n => n.trim()).filter(n => n.length > 0);
			
			// Validate that we have at least one valid name after processing
			if (nameList.length === 0) {
				throw new Error('Missing or invalid context name(s)');
			}
		} else if (name !== undefined) {
			// Single name provided
			if (!isValidString(name)) {
				throw new Error('Invalid context name: empty string');
			}
			nameList = [name.trim()];
		} else {
			throw new Error('Missing context name(s)');
		}
		
		// Validate each name (defensive check)
		for (const contextName of nameList) {
			if (!contextName || contextName.trim() === '') {
				throw new Error('Invalid context name: empty string');
			}
		}
		
		// Check for duplicate names
		const uniqueNames = new Set(nameList);
		if (uniqueNames.size !== nameList.length) {
			throw new Error('Duplicate context names are not allowed');
		}
		
		// Create contexts if they don't exist
		for (const contextName of nameList) {
			if (!contextStore.has(contextName)) {
				contextStore.set(contextName, []);
			}
		}
		
		// Save selected context names
		selectedContextNames = nameList;
		
		// Return confirmation message
		const message = nameList.length === 1
			? `Context set to: ${nameList[0]}`
			: `Contexts selected: ${nameList.join(', ')}`;
		
		return {
			messages: [{
				role: 'agent',
				content: message
			}]
		};
	}
};

/**
 * API: Gets all selected context names.
 * 
 * @returns Array of selected context names
 */
export function contextNames(): string[] {
	return [...selectedContextNames];
}

/**
 * API: Gets all selected contexts with their messages.
 * Messages are automatically truncated if they exceed the model's token limit.
 * 
 * @returns Array of context objects with name and truncated messages
 */
export function getContext(): Context[] {
	return selectedContextNames.map(name => {
		const messages = contextStore.get(name) || [];
		const truncated = truncateMessages(messages, name);
		return {
			name,
			messages: truncated
		};
	});
}

/**
 * API: Sets and saves the selected context names for the session.
 * Creates contexts if they don't exist.
 * 
 * @param names - Array of context names to select
 * @throws Error if names array is empty or invalid
 * @throws Error if context names contain duplicates
 */
export function selectContext(names: string[]): void {
	if (!Array.isArray(names) || names.length === 0) {
		throw new Error('Missing or invalid context names');
	}
	
	// Validate each name
	for (const name of names) {
		if (!isValidString(name)) {
			throw new Error('Invalid context name: must be non-empty string');
		}
	}
	
	// Check for duplicate names
	const uniqueNames = new Set(names);
	if (uniqueNames.size !== names.length) {
		throw new Error('Duplicate context names are not allowed');
	}
	
	// Create contexts if they don't exist
	for (const name of names) {
		if (!contextStore.has(name)) {
			contextStore.set(name, []);
		}
	}
	
	selectedContextNames = [...names];
}

/**
 * API: Adds a message to a specific context.
 * Creates the context if it doesn't exist.
 * 
 * @param contextName - Name of the context
 * @param role - Message role ('user' or 'assistant')
 * @param content - Message content
 */
export function addMessageToContext(contextName: string, role: 'user' | 'assistant', content: string): void {
	if (!contextStore.has(contextName)) {
		contextStore.set(contextName, []);
	}
	
	contextStore.get(contextName)!.push({ role, content });
}

/**
 * API: Appends messages to a specific context.
 * Creates the context if it doesn't exist.
 * 
 * @param contextName - Name of the context
 * @param messages - Array of messages to append
 */
export function appendContext(contextName: string, messages: ContextMessage[]): void {
	if (!contextStore.has(contextName)) {
		contextStore.set(contextName, []);
	}
	
	contextStore.get(contextName)!.push(...messages);
}

/**
 * API: Sets (replaces) all messages in a specific context.
 * Creates the context if it doesn't exist.
 * 
 * @param contextName - Name of the context
 * @param messages - Array of messages to set
 */
export function setContext(contextName: string, messages: ContextMessage[]): void {
	contextStore.set(contextName, [...messages]);
}

/**
 * Resets all context state. Used for testing.
 */
export function resetState(): void {
	contextStore.clear();
	selectedContextNames = [];
	currentModelId = undefined;
	warningCallback = undefined;
}

/**
 * API: Sets the current model ID for token limit enforcement.
 * 
 * @param modelId - Model ID to set (e.g., 'gpt-4o', 'claude-3')
 */
export function setModelId(modelId: string | undefined): void {
	currentModelId = modelId;
}

/**
 * API: Gets the current model ID.
 * 
 * @returns Current model ID or undefined
 */
export function getModelId(): string | undefined {
	return currentModelId;
}

/**
 * API: Sets a callback function to show warnings to the user.
 * 
 * @param callback - Function to call when showing warnings
 */
export function setWarningCallback(callback: (message: string) => void): void {
	warningCallback = callback;
}

/**
 * API: Gets the token limit for a specific model.
 * 
 * @param modelId - Model ID to check (optional, uses current model if not provided)
 * @returns Token limit for the model
 */
export function getTokenLimit(modelId?: string): number {
	if (modelId) {
		return MODEL_TOKEN_LIMITS[modelId] || DEFAULT_TOKEN_LIMIT;
	}
	return getModelTokenLimit();
}
