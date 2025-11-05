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

import * as vscode from 'vscode';
import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';
import { validateRequiredString } from '../validation';

/**
 * Model skill implementation.
 * Sets the active LLM model for subsequent requests.
 */
export const modelSkill: Skill = {
	name: 'model',
	description: 'Set the active LLM model for subsequent requests.',
	params: [
		{ name: 'id', description: 'Model ID to select (e.g., gpt-4o, claude-3)', required: true }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { id } = params;
		
		// Validate model ID parameter
		validateRequiredString(id, 'model id');
		
		// Check if the model exists in available models
		const availableModels = await vscode.lm.selectChatModels({ id });
		
		if (availableModels.length === 0) {
			throw new Error(`Model "${id}" is not available. Please check the model ID and ensure the required extension is installed.`);
		}
		
		// Select the model using the SkillApi
		await api.selectChatModel(id);
		
		// Return confirmation message
		const message = `Model set to: ${id}`;
		
		// Add to context automatically as agent
		api.addToContext('agent', message);
		
		return {
			messages: [{
				role: 'agent',
				content: message
			}]
		};
	}
};
