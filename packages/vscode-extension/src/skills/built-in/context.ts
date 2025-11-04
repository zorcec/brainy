/**
 * Module: skills/built-in/context.ts
 *
 * Description:
 *   Built-in context manipulation skill for Brainy.
 *   Allows users to switch to or create named agent contexts within playbooks.
 *   Contexts are tracked in memory for the session and messages are stored
 *   in chronological order with role and content for LLM API compatibility.
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
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

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
 * Context skill implementation.
 * Selects one or more agent contexts for the session.
 */
export const contextSkill: Skill = {
	name: 'context',
	description: 'Select one or more agent contexts for the session.',
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		// Extract context names from params
		// Support both --name "single" and --names "name1,name2,name3"
		const { name, names } = params;
		
		let nameList: string[];
		
		if (names !== undefined) {
			// Multiple names provided as comma-separated string
			// Check if names is empty or whitespace-only
			if (typeof names !== 'string' || names.trim() === '') {
				throw new Error('Missing or invalid context name(s)');
			}
			nameList = names.split(',').map(n => n.trim()).filter(n => n.length > 0);
			
			// Validate that we have at least one valid name after processing
			if (nameList.length === 0) {
				throw new Error('Missing or invalid context name(s)');
			}
		} else if (name !== undefined) {
			// Single name provided
			// Check if name is empty or whitespace-only
			if (typeof name !== 'string' || name.trim() === '') {
				throw new Error('Invalid context name: empty string');
			}
			nameList = [name.trim()];
		} else {
			throw new Error('Missing context name(s)');
		}
		
		// Validate each name (no empty strings) - should not happen after above checks
		// but keeping as defensive check
		for (const contextName of nameList) {
			if (!contextName || contextName.trim() === '') {
				throw new Error('Invalid context name: empty string');
			}
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
 * 
 * @returns Array of context objects with name and messages
 */
export function getContext(): Context[] {
	return selectedContextNames.map(name => ({
		name,
		messages: contextStore.get(name) || []
	}));
}

/**
 * API: Sets and saves the selected context names for the session.
 * Creates contexts if they don't exist.
 * 
 * @param names - Array of context names to select
 * @throws Error if names array is empty or invalid
 */
export function selectContext(names: string[]): void {
	if (!Array.isArray(names) || names.length === 0) {
		throw new Error('Missing or invalid context names');
	}
	
	// Validate each name
	for (const name of names) {
		if (!name || typeof name !== 'string' || name.trim() === '') {
			throw new Error('Invalid context name: must be non-empty string');
		}
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
}
