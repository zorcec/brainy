/**
 * Module: markdown/completionProvider.ts
 *
 * Description:
 *   Completion provider for Brainy playbook syntax.
 *   Provides autocomplete for skills, models, and skill parameters.
 *   Triggers on @ for skills, -- for parameters, and after model flag.
 *
 * Usage:
 *   import { BrainyCompletionProvider } from './markdown/completionProvider';
 *   vscode.languages.registerCompletionItemProvider(
 *     { language: 'markdown' },
 *     new BrainyCompletionProvider(),
 *     '@', '-', '"'
 *   );
 */

import * as vscode from 'vscode';
import { getAvailableSkills } from '../skills/skillScanner';

/**
 * Known model IDs for autocomplete.
 */
const KNOWN_MODELS = [
	'gpt-4',
	'gpt-4-32k',
	'gpt-4o',
	'gpt-4o-mini',
	'claude-3',
	'claude-3-opus',
	'claude-3-sonnet',
	'claude-3-haiku',
	'claude-3.5',
	'claude-3.5-sonnet'
];

/**
 * Common skill parameters.
 */
const COMMON_PARAMETERS = [
	{ name: 'prompt', description: 'Prompt text for the task' },
	{ name: 'variable', description: 'Variable name to store the result' },
	{ name: 'name', description: 'Name for this operation' },
	{ name: 'names', description: 'Multiple names (comma-separated)' },
	{ name: 'id', description: 'Identifier or model ID' },
	{ name: 'action', description: 'Action to perform' },
	{ name: 'path', description: 'File or directory path' }
];

/**
 * Completion provider for Brainy playbooks.
 */
export class BrainyCompletionProvider implements vscode.CompletionItemProvider {
	/**
	 * Provides completion items at the current position.
	 *
	 * @param document - The document to provide completions for
	 * @param position - The position where completions were requested
	 * @returns Array of completion items or undefined
	 */
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position
	): vscode.CompletionItem[] | undefined {
		const line = document.lineAt(position).text;
		const linePrefix = line.substring(0, position.character);

		// Suggest skills after '@' at the start of a line
		if (/^\s*@\w*$/.test(linePrefix)) {
			return this.getSkillCompletions();
		}

		// Suggest models after --id for @model command
		if (/@model\s+--id\s+"?[\w-]*$/.test(linePrefix)) {
			return this.getModelCompletions();
		}

		// Suggest parameters after '--'
		if (/--\w*$/.test(linePrefix)) {
			return this.getParameterCompletions();
		}

		return undefined;
	}

	/**
	 * Gets completion items for available skills.
	 *
	 * @returns Array of completion items for skills
	 */
	private getSkillCompletions(): vscode.CompletionItem[] {
		const skills = getAvailableSkills();
		
		return skills.map(skillName => {
			const item = new vscode.CompletionItem(skillName, vscode.CompletionItemKind.Function);
			item.insertText = skillName;
			item.detail = `@${skillName}`;
			
			// Add descriptions for known skills
			switch (skillName) {
				case 'context':
					item.documentation = 'Select one or more agent contexts for the session';
					break;
				case 'model':
					item.documentation = 'Set the active LLM model for subsequent requests';
					break;
				case 'task':
					item.documentation = 'Execute a task with the LLM';
					break;
				case 'execute':
					item.documentation = 'Execute code blocks or scripts';
					break;
				default:
					item.documentation = `Skill: ${skillName}`;
			}
			
			return item;
		});
	}

	/**
	 * Gets completion items for available models.
	 *
	 * @returns Array of completion items for models
	 */
	private getModelCompletions(): vscode.CompletionItem[] {
		return KNOWN_MODELS.map(modelId => {
			const item = new vscode.CompletionItem(modelId, vscode.CompletionItemKind.Value);
			item.insertText = `"${modelId}"`;
			item.detail = 'LLM Model';
			
			// Add descriptions for models
			if (modelId.startsWith('gpt-4')) {
				item.documentation = `OpenAI ${modelId}`;
			} else if (modelId.startsWith('claude')) {
				item.documentation = `Anthropic ${modelId}`;
			}
			
			return item;
		});
	}

	/**
	 * Gets completion items for skill parameters.
	 *
	 * @returns Array of completion items for parameters
	 */
	private getParameterCompletions(): vscode.CompletionItem[] {
		return COMMON_PARAMETERS.map(param => {
			const item = new vscode.CompletionItem(param.name, vscode.CompletionItemKind.Field);
			item.insertText = param.name;
			item.detail = `--${param.name}`;
			item.documentation = param.description;
			
			return item;
		});
	}

	/**
	 * Resolves additional information for a completion item.
	 *
	 * @param item - The completion item to resolve
	 * @returns The resolved completion item
	 */
	resolveCompletionItem(item: vscode.CompletionItem): vscode.CompletionItem {
		return item;
	}
}
