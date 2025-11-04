/**
 * Module: skills/built-in/task.ts
 *
 * Description:
 *   Built-in task skill for Brainy.
 *   Allows users to send prompts to the LLM and capture responses as part of automated workflows.
 *   The skill sends the prompt as a user message and returns the LLM's reply as an assistant message.
 *   The VS Code extension handles context; the skill only sends the user prompt.
 *
 * Usage in playbooks:
 *   @task --prompt "Summarize this text"
 *   @task --prompt "Analyze the code" --model "gpt-4o"
 *
 * Parameters:
 *   - prompt: The text to send to the LLM (required, non-empty string)
 *   - model: Optional model ID (e.g., 'gpt-4o'). If not provided, uses globally selected model.
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

/**
 * Task skill implementation.
 * Sends a prompt to the LLM and returns the response.
 */
export const taskSkill: Skill = {
	name: 'task',
	description: 'Send a prompt to the LLM and return the response. Only user prompts are supported. The VS Code extension handles context.',
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { prompt, model } = params;
		
		// Validate prompt parameter
		if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
			throw new Error('Missing or invalid prompt');
		}
		
		// Send request to LLM (internally always uses role 'user')
		// If model is not provided, the globally selected model is used
		const result = await api.sendRequest('user', prompt, model);
		
		// Return the response as an assistant message
		return {
			messages: [{
				role: 'assistant',
				content: result.response
			}]
		};
	}
};
