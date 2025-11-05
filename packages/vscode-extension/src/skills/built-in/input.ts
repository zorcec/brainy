/**
 * Module: skills/built-in/input.ts
 *
 * Description:
 *   Built-in input skill for Brainy.
 *   Opens an input dialog in VS Code to prompt the user for interactive input.
 *   The input value is stored in a variable for use in subsequent playbook steps.
 *   Execution pauses until the user provides input or cancels.
 *
 * Usage in playbooks:
 *   @input --prompt "Enter your name" --variable userName
 *   @input --prompt "Enter API key" --variable apiKey
 *
 * Parameters:
 *   - prompt: The prompt text to display to the user (required, non-empty string)
 *   - variable: The variable name to store the input value in (required, non-empty string)
 *
 * Behavior:
 *   - Opens a VS Code input dialog with the specified prompt
 *   - Waits for user input
 *   - Stores the input value in the specified variable
 *   - Throws error if user cancels or if parameters are invalid
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';
import { validateRequiredString } from '../validation';

/**
 * Input skill implementation.
 * Opens an input dialog and stores the result in a variable.
 */
export const inputSkill: Skill = {
	name: 'input',
	description: 'Prompt the user for input and store it in a variable. Execution pauses until input is provided.',
	params: [
		{ name: 'prompt', description: 'Prompt text to display to the user', required: true },
		{ name: 'variable', description: 'Variable name to store the input value', required: true }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { prompt, variable } = params;
		
		// Validate parameters
		validateRequiredString(prompt, 'prompt');
		validateRequiredString(variable, 'variable name');
		
		// Open input dialog and wait for user input
		const value = await api.openInputDialog(prompt);
		
		// Store the value in the variable
		api.setVariable(variable, value);
		
		// Return user-type message with prompt and user input
		const message = `${prompt}: ${value}`;
		
		// Add to context automatically
		api.addToContext('user', message);
		
		return {
			messages: [{
				role: 'user',
				content: message
			}]
		};
	}
};
