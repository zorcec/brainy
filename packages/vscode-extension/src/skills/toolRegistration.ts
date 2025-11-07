/**
 * Module: skills/toolRegistration.ts
 *
 * Description:
 *   Handles registration of skills as VS Code Language Model tools.
 *   Skills can opt-in to tool registration by setting registerAsTool: true.
 *   Converts skill parameter definitions to JSON schema for tool inputSchema.
 *   Shows error notifications for registration failures.
 *
 * Usage:
 *   import { registerSkillsAsTools } from './toolRegistration';
 *   const disposables = await registerSkillsAsTools(skills);
 *   context.subscriptions.push(...disposables);
 */

import * as vscode from 'vscode';
import type { Skill, SkillParameter } from './types';
import { createSkillApi } from './skillApi';

/**
 * Converts skill parameters to JSON schema format for tool inputSchema.
 * 
 * @param params - Array of skill parameter definitions
 * @returns JSON schema object with properties and required fields
 */
function convertParamsToJsonSchema(params?: SkillParameter[]): object {
	if (!params || params.length === 0) {
		return {
			type: 'object',
			properties: {},
			required: []
		};
	}

	const properties: Record<string, object> = {};
	const required: string[] = [];

	for (const param of params) {
		properties[param.name] = {
			type: 'string',
			description: param.description
		};

		if (param.required) {
			required.push(param.name);
		}
	}

	return {
		type: 'object',
		properties,
		required
	};
}

/**
 * Registers skills as VS Code Language Model tools.
 * Only skills with registerAsTool: true will be registered.
 * Shows error notification and skips registration on failures.
 * 
 * @param skills - Array of skill objects to potentially register
 * @returns Array of disposables for registered tools
 */
export async function registerSkillsAsTools(skills: Skill[]): Promise<vscode.Disposable[]> {
	const disposables: vscode.Disposable[] = [];

	for (const skill of skills) {
		// Skip skills that don't opt-in to tool registration
		if (!skill.registerAsTool) {
			continue;
		}

		try {
			// Create a LanguageModelTool object
			const tool: vscode.LanguageModelTool<any> = {
				invoke: async (options: vscode.LanguageModelToolInvocationOptions<any>, token: vscode.CancellationToken) => {
					// Convert input to SkillParams format
					const params: Record<string, string> = {};
					if (options.input && typeof options.input === 'object') {
						for (const [key, value] of Object.entries(options.input)) {
							params[key] = String(value);
						}
					}

					// Create a SkillApi instance for execution
					const api = createSkillApi();

					try {
						// Execute the skill
						const result = await skill.execute(api, params);
						
						// Return result as LanguageModelToolResult
						// Combine all messages into a single content string
						const content = result.messages
							.map(msg => msg.content)
							.join('\n\n');

						return new vscode.LanguageModelToolResult([
							new vscode.LanguageModelTextPart(content)
						]);
					} catch (error) {
						// Return error as tool result
						const errorMessage = error instanceof Error ? error.message : String(error);
						return new vscode.LanguageModelToolResult([
							new vscode.LanguageModelTextPart(`Error executing skill: ${errorMessage}`)
						]);
					}
				}
			};

			// Register the tool with VS Code
			const disposable = vscode.lm.registerTool(skill.name, tool);
			disposables.push(disposable);

			console.log(`✓ Registered skill '${skill.name}' as tool`);
		} catch (error) {
			// Show error notification and continue with other skills
			const errorMessage = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Failed to register skill '${skill.name}' as tool: ${errorMessage}`);
			console.error(`Failed to register skill '${skill.name}' as tool:`, error);
		}
	}

	return disposables;
}
