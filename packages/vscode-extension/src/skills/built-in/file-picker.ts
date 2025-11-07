/**
 * Module: skills/built-in/file-picker.ts
 *
 * Description:
 *   Built-in file picker skill for Brainy.
 *   Allows users to select one or multiple files/folders using VS Code's file dialog.
 *   Returns selected file paths as a newline-separated string.
 *   Supports flexible selection options (files, folders, single, multiple).
 *
 * Usage in playbooks:
 *   @file-picker --variable selectedFiles
 *   @file-picker --variable folders --folders "true"
 *   @file-picker --variable singleFile --multiple "false"
 *
 * Parameters:
 *   - variable: Variable name to store the selected paths (required, non-empty string)
 *   - files: Whether to allow file selection (optional, default: true)
 *   - folders: Whether to allow folder selection (optional, default: false)
 *   - multiple: Whether to allow multiple selection (optional, default: true)
 *
 * Behavior:
 *   - Opens VS Code file picker dialog with specified options
 *   - Waits for user to select files/folders or cancel
 *   - If user cancels, returns empty result (no error thrown)
 *   - If user selects, stores paths as newline-separated string in variable
 *   - Returns agent message confirming selection
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';
import { validateRequiredString } from '../validation';

/**
 * File picker skill implementation.
 * Opens a file picker dialog and stores selected paths in a variable.
 */
export const filePickerSkill: Skill = {
	name: 'file-picker',
	description: 'Select files or folders using a file picker dialog. Stores selected paths in a variable.',
	params: [
		{ name: 'variable', description: 'Variable name to store selected paths (newline-separated). If omitted, no variable is set', required: false },
		{ name: 'prompt', description: 'Prompt text to show to the user and include in the result', required: false }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { variable, prompt } = params;

		// variable is optional; only validate if provided and non-empty
		if (variable !== undefined) {
			validateRequiredString(variable, 'variable name');
		}

		// Always allow files, folders and multiple selection per new requirements
		const selectedUris = await api.openFileDialog({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true
		});
		
		// Handle cancellation (user closed dialog without selecting)
		if (!selectedUris || selectedUris.length === 0) {
			return {
				messages: [{
					role: 'agent',
					content: 'File picker cancelled - no files selected'
				}]
			};
		}
		
		// Check Node.js fs availability for directory detection
		let fs: typeof import('fs') | undefined;
		try {
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			fs = require('fs');
		} catch {
			fs = undefined;
		}

		// Format paths with directory indicator (use fs if available)
		const formattedPaths = selectedUris.map(uri => {
			let isDirectory = false;
			if (fs) {
				try {
					isDirectory = fs.lstatSync(uri.fsPath).isDirectory();
				} catch {
					isDirectory = false;
				}
			}

			const relativePath = uri.fsPath.startsWith(process.cwd())
				? './' + uri.fsPath.slice(process.cwd().length + 1)
				: uri.fsPath;

			// Directories should be shown with trailing slash and labelled as directory in parentheses
			const displayPath = isDirectory ? `${relativePath}/` : relativePath;
			return `- ${displayPath}${isDirectory ? ' (directory)' : ''}`;
		});

		// Build output including prompt if provided
		const promptHeader = prompt ? `${prompt}:\n` : '';
		const output = `${promptHeader}${formattedPaths.join('\n')}`;

		// Store formatted output in variable only if variable was provided
		if (variable !== undefined) {
			api.setVariable(variable, output);
		}

		// Return confirmation message including prompt and selection list
		const messageLines = [] as string[];
		if (prompt) {
			messageLines.push(`${prompt}:`);
		}
		messageLines.push(...formattedPaths);

		return {
			messages: [{
				role: 'agent',
				content: messageLines.join('\n')
			}]
		};
	}
};
