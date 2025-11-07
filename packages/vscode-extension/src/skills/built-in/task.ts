/**
 * Module: skills/built-in/task.ts
 *
 * Description:
 *   Built-in task skill for Brainy.
 *   Allows users to send prompts to the LLM and capture responses as part of automated workflows.
 *   The skill sends the prompt as a user message and returns the LLM's reply as an assistant message.
 *   The VS Code extension handles context; the skill only sends the user prompt.
 *   Supports automatic tool-calling - if no tools are specified, all available tools are used by default.
 *   Supports variable substitution in prompts using {{variableName}} syntax.
 *   Supports storing the response in a variable using the --variable parameter.
 *
 * Usage in playbooks:
 *   @task --prompt "Summarize this text"
 *   @task --prompt "Analyze the code" --model "gpt-4o"
 *   @task --prompt "Hello, {{userName}}!" --variable greeting
 *
 * Parameters:
 *   - prompt: The text to send to the LLM (required, non-empty string)
 *   - model: Optional model ID (e.g., 'gpt-4o'). If not provided, uses globally selected model.
 *   - variable: Optional variable name to store the response in
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';
import { validateRequiredString, isValidString } from '../validation';

import { DEFAULT_MODEL_ID } from '../../markdown/playbookExecutor';

/**
 * Substitutes variables in text using {{variableName}} syntax.
 * Variables are case-sensitive. Undefined variables are replaced with empty string.
 * 
 * @param text - Text with potential variable placeholders
 * @param api - SkillApi for accessing variables
 * @returns Text with variables substituted
 */
export function substituteVariables(text: string, api: SkillApi, preserveUnknown = false): string {
	return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
		const value = api.getVariable(varName);
		// If variable is undefined or null, either leave placeholder unchanged or replace with empty string
		if (typeof value === 'undefined' || value === null) {
			return preserveUnknown ? match : '';
		}
		return String(value);
	});
}

/**
 * Task skill implementation.
 * Sends a prompt to the LLM and returns the response.
 * Automatically uses all available tools unless explicitly disabled.
 * Supports variable substitution in prompts and storing responses in variables.
 * Supports debug mode to dump context without calling LLM.
 */
export const taskSkill: Skill = {
	name: 'task',
	description: 'Send a prompt to the LLM and return the response. Only user prompts are supported. The VS Code extension handles context. Automatically uses all available tools. Supports variable substitution using {{name}} syntax. Use --debug flag to dump context instead of calling LLM.',
	params: [
		{ name: 'prompt', description: 'Prompt text to send to the LLM', required: true },
		{ name: 'model', description: 'Optional model ID (e.g., gpt-4o, claude-3)', required: false },
		{ name: 'variable', description: 'Variable name to store the response', required: false },
		{ name: 'debug', description: 'Dump full context as JSON instead of calling LLM', required: false }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { prompt, model, variable, debug } = params;
		
		// Validate prompt parameter
		validateRequiredString(prompt, 'prompt');
		
		// Substitute variables in the prompt
		const processedPrompt = substituteVariables(prompt, api);
		
		// Debug mode: dump context and return without calling LLM
		if (typeof debug !== 'undefined') {
			const currentContext = await api.getContext();
			
			// Safely serialize context to avoid circular reference errors
			// Use a custom replacer to handle circular references and large content
			const seen = new WeakSet();
			const contextJson = JSON.stringify({
				prompt: processedPrompt,
				model: model,
				context: currentContext
			}, (key, value) => {
				// Handle circular references
				if (typeof value === 'object' && value !== null) {
					if (seen.has(value)) {
						return '[Circular Reference]';
					}
					seen.add(value);
				}
				// Truncate long strings to prevent overwhelming output
				if (typeof value === 'string' && value.length > 500) {
					return value.substring(0, 500) + '... [truncated]';
				}
				return value;
			}, 2);
			
			return {
				messages: [
					{ role: 'user', content: contextJson },
					{ role: 'agent', content: `Debug mode: dumped context with ${currentContext.length} messages` }
				]
			};
		}
		
		// Get all available tools by default
		const tools = await api.getAllAvailableTools();
		
		// Send request to LLM with tools (internally always uses role 'user')
		// If model is not provided, the globally selected model is used
		const result = await api.sendRequest('user', processedPrompt, model, { tools });
		
		// Store response in variable if requested
		if (isValidString(variable)) {
			api.setVariable(variable, result.response);
		}
		
		// Return both user prompt and assistant response
		return {
			messages: [
				{ role: 'user', content: processedPrompt },
				{ role: 'assistant', content: result.response }
			]
		};
	}
};
