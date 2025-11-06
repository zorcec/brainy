/**
 * Module: skills/built-in/context.ts
 *
 * Description:
 *   Built-in context manipulation skill for Brainy.
 *   Allows users to switch to or create a named agent context within playbooks.
 *   Only one context can be selected at a time.
 *   Contexts are tracked in memory for the session and messages are stored
 *   in chronological order with role and content for LLM API compatibility.
 *   Dynamically retrieves token limits from VS Code LM API and automatically 
 *   truncates contexts by removing oldest messages first (FIFO) when limits are exceeded.
 *
 * Usage in playbooks:
 *   @context --name "research"
 *
 * Parameters:
 *   - name: Context name (string, required)
 *
 * Context Structure:
 *   Each context stores an array of message objects:
 *   [{ role: 'user' | 'assistant', content: string }, ...]
 *
 * Token Limits:
 *   Token limits are dynamically retrieved from the VS Code LM API at runtime.
 *   When a context exceeds the limit, the oldest messages are removed until 
 *   the context is under the limit.
 */

import * as vscode from 'vscode';
import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';
import { isValidString } from '../validation';

/**
 * Model-specific input token limits.
 * These are fallback values used when VS Code LM API is not available.
 * The actual limits are retrieved dynamically from the model at runtime.
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
	role: 'user' | 'assistant' | 'agent';
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
 * Currently selected context name for the session.
 * Only one context can be selected at a time.
 */
let selectedContextName: string | undefined;

/**
 * Currently selected model ID for token limit enforcement.
 */
let currentModelId: string | undefined;

/**
 * Current model instance from VS Code LM API for dynamic token counting.
 */
let currentModel: vscode.LanguageModelChat | undefined;

/**
 * Callback function to show warnings to the user.
 */
let warningCallback: ((message: string) => void) | undefined;

/**
 * Estimates the number of tokens in a text string using VS Code LM API if available.
 * Falls back to a simple heuristic: ~4 characters per token for English text.
 * 
 * @param text - Text to count tokens for
 * @returns Estimated token count
 */
async function estimateTokens(text: string): Promise<number> {
	// If we have a current model, use its countTokens method
	if (currentModel) {
		try {
			return await currentModel.countTokens(text);
		} catch (error) {
			// Fall back to heuristic if countTokens fails
			console.warn('Failed to count tokens via VS Code LM API, using fallback estimation:', error);
		}
	}
	
	// Fallback heuristic: ~4 characters per token
	return Math.ceil(text.length / 4);
}

/**
 * Gets the token limit for the current model.
 * Tries to use VS Code LM API first, falls back to hardcoded limits.
 * 
 * @returns Token limit for current model or default limit
 */
async function getModelTokenLimit(): Promise<number> {
	// If we have a current model with maxInputTokens, use it
	if (currentModel && currentModel.maxInputTokens) {
		return currentModel.maxInputTokens;
	}
	
	// Fall back to hardcoded limits based on model ID
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
async function countMessagesTokens(messages: ContextMessage[]): Promise<number> {
	let total = 0;
	for (const msg of messages) {
		total += await estimateTokens(msg.content);
	}
	return total;
}

/**
 * Truncates messages by removing oldest first until under token limit.
 * Shows a warning if any messages were removed.
 * 
 * @param messages - Array of messages to truncate
 * @param contextName - Name of the context (for warning message)
 * @returns Truncated array of messages
 */
async function truncateMessages(messages: ContextMessage[], contextName: string): Promise<ContextMessage[]> {
	const limit = await getModelTokenLimit();
	let totalTokens = await countMessagesTokens(messages);
	
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
			totalTokens -= await estimateTokens(removed.content);
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
 * Selects a single agent context for the session.
 */
export const contextSkill: Skill = {
	name: 'context',
	description: 'Select an agent context for the session. Only one context can be selected at a time.',
	params: [
		{ name: 'name', description: 'Context name', required: true }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		// Extract context name from params
		const { name } = params;
		
		// Validate name parameter
		if (!isValidString(name)) {
			throw new Error('Missing or invalid context name');
		}
		
		const contextName = name.trim();
		
		// Create context if it doesn't exist
		if (!contextStore.has(contextName)) {
			contextStore.set(contextName, []);
		}
		
		// Save selected context name
		selectedContextName = contextName;
		
		// Return confirmation message
		const message = `Context set to: ${contextName}`;
		
		// Add confirmation message to the context
		addMessageToContext(contextName, 'agent', message);
		
		return {
			messages: [{
				role: 'agent',
				content: message
			}]
		};
	}
};

/**
 * API: Gets the selected context name.
 * 
 * @returns Selected context name or undefined if no context is selected
 */
export function contextNames(): string | undefined {
	return selectedContextName;
}

/**
 * API: Gets the selected context with its messages.
 * Messages are automatically truncated if they exceed the model's token limit.
 * 
 * @returns Promise resolving to context object with name and truncated messages, or undefined if no context is selected
 */
export async function getContext(): Promise<Context | undefined> {
	if (!selectedContextName) {
		return undefined;
	}
	
	const messages = contextStore.get(selectedContextName) || [];
	const truncated = await truncateMessages(messages, selectedContextName);
	
	return {
		name: selectedContextName,
		messages: truncated
	};
}

/**
 * API: Sets and saves the selected context name for the session.
 * Creates the context if it doesn't exist.
 * 
 * @param name - Context name to select
 * @throws Error if name is invalid
 */
export function selectContext(name: string): void {
	if (!isValidString(name)) {
		throw new Error('Invalid context name: must be non-empty string');
	}
	
	// Create context if it doesn't exist
	if (!contextStore.has(name)) {
		contextStore.set(name, []);
	}
	
	selectedContextName = name;
}

/**
 * API: Adds a single message to a specific context.
 * Creates the context if it doesn't exist.
 * 
 * @param contextName - Name of the context
 * @param role - Message role ('user' or 'assistant' or 'agent')
 * @param content - Message content
 */
export function addMessageToContext(contextName: string, role: 'user' | 'assistant' | 'agent', content: string): void {
	if (!contextStore.has(contextName)) {
		contextStore.set(contextName, []);
	}
	
	contextStore.get(contextName)!.push({ role, content });
	console.log(`Added message to context "${contextName}": [${role}] ${content}`);
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
	selectedContextName = undefined;
	currentModelId = undefined;
	currentModel = undefined;
	warningCallback = undefined;
}

/**
 * API: Sets the current model ID for token limit enforcement.
 * Also attempts to retrieve the model instance from VS Code LM API.
 * 
 * @param modelId - Model ID to set (e.g., 'gpt-4o', 'claude-3')
 */
export async function setModelId(modelId: string | undefined): Promise<void> {
	currentModelId = modelId;
	currentModel = undefined;
	
	// Try to get the model instance from VS Code LM API
	if (modelId) {
		try {
			const models = await vscode.lm.selectChatModels({
				vendor: 'copilot',
				family: modelId
			});
			if (models.length > 0) {
				currentModel = models[0];
			}
		} catch (error) {
			// Silently fail - we'll use fallback token limits
			console.warn('Failed to retrieve model from VS Code LM API:', error);
		}
	}
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
 * @returns Promise resolving to token limit for the model
 */
export async function getTokenLimit(modelId?: string): Promise<number> {
	if (modelId) {
		// Check hardcoded limits first for known models
		if (MODEL_TOKEN_LIMITS[modelId]) {
			return MODEL_TOKEN_LIMITS[modelId];
		}
		
		// For unknown models, try to get limit from VS Code LM API
		try {
			const models = await vscode.lm.selectChatModels({
				vendor: 'copilot',
				family: modelId
			});
			if (models.length > 0 && models[0].maxInputTokens) {
				return models[0].maxInputTokens;
			}
		} catch (error) {
			// Fall through to default
		}
		
		// If model is unknown and API doesn't have it, use default
		return DEFAULT_TOKEN_LIMIT;
	}
	return await getModelTokenLimit();
}
