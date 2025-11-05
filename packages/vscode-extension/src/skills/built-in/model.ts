/**
 * Module: skills/built-in/model.ts
 *
 * Description:
 *   Built-in model selection skill for Brainy.
 *   Allows users to programmatically switch the active LLM model within playbooks.
 *   Uses the SkillApi's selectChatModel method to set the model globally.
 *
 * Usage in playbooks:
 *   @model --id "gpt-4o"
 *   @model --id "claude-3"
 *
 * Parameters:
 *   - id: Model ID to select (e.g., 'gpt-4o', 'claude-3')
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';
import { validateRequiredString } from '../validation';

/**
 * Model skill implementation.
 * Sets the active LLM model for subsequent requests.
 */
export const modelSkill: Skill = {
	name: 'model',
	description: 'Set the active LLM model for subsequent requests.',
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { id } = params;
		
		// Validate model ID parameter
		validateRequiredString(id, 'model id');
		
		// Select the model using the SkillApi
		await api.selectChatModel(id);
		
		// Return confirmation message
		return {
			messages: [{
				role: 'agent',
				content: `Model set to: ${id}`
			}]
		};
	}
};
