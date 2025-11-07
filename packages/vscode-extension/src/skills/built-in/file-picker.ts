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
 * Parses a string boolean parameter.
 * 
 * @param value - Parameter value (string or undefined)
 * @param defaultValue - Default value if undefined
 * @returns Boolean value
 */
function parseBooleanParam(value: string | undefined, defaultValue: boolean): boolean {
	if (value === undefined) {
		return defaultValue;
	}
	const normalized = value.trim().toLowerCase();
	return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

/**
 * File picker skill implementation.
 * Opens a file picker dialog and stores selected paths in a variable.
 */
export const filePickerSkill: Skill = {
	name: 'file-picker',
	description: 'Select files or folders using a file picker dialog. Stores selected paths in a variable.',
	params: [
		{ name: 'variable', description: 'Variable name to store selected paths (newline-separated)', required: true },
		{ name: 'files', description: 'Allow file selection (true/false, default: true)', required: false },
		{ name: 'folders', description: 'Allow folder selection (true/false, default: false)', required: false },
		{ name: 'multiple', description: 'Allow multiple selection (true/false, default: true)', required: false }
	],
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const { variable, files, folders, multiple } = params;
		
		// Validate variable parameter
		validateRequiredString(variable, 'variable name');
		
		// Parse boolean parameters
		const canSelectFiles = parseBooleanParam(files, true);
		const canSelectFolders = parseBooleanParam(folders, false);
		const canSelectMany = parseBooleanParam(multiple, true);
		
		// Open file picker dialog
		const selectedUris = await api.openFileDialog({
			canSelectFiles,
			canSelectFolders,
			canSelectMany
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
		let fs: typeof import('fs');
		try {
			fs = require('fs');
		} catch {
			// In web environment, fall back to simple path formatting without directory detection
			const paths = selectedUris.map(uri => uri.fsPath).join('\n');
			api.setVariable(variable, paths);
			
			const count = selectedUris.length;
			const itemType = canSelectFolders && !canSelectFiles ? 'folder' : 
			                 canSelectFiles && !canSelectFolders ? 'file' : 'item';
			const message = `Selected ${count} ${itemType}${count !== 1 ? 's' : ''}`;
			
			return {
				messages: [{
					role: 'agent',
					content: message
				}]
			};
		}
		
		// Format paths with directory indicator
		const formattedPaths = selectedUris.map(uri => {
			let isDirectory = false;
			try {
				// Try to check if it's a directory (may fail if path doesn't exist)
				isDirectory = fs.lstatSync(uri.fsPath).isDirectory();
			} catch {
				// If lstat fails, assume it's a file
				isDirectory = false;
			}
			
			const relativePath = uri.fsPath.startsWith(process.cwd()) 
				? './' + uri.fsPath.slice(process.cwd().length + 1)
				: uri.fsPath;
			return `- ${relativePath}${isDirectory ? ' (directory)' : ''}`;
		});
		
		const output = `Files selected\n${formattedPaths.join('\n')}`;
		
		// Store formatted output in variable
		api.setVariable(variable, output);
		
		// Return confirmation message
		const count = selectedUris.length;
		const itemType = canSelectFolders && !canSelectFiles ? 'folder' : 
		                 canSelectFiles && !canSelectFolders ? 'file' : 'item';
		const message = `Selected ${count} ${itemType}${count !== 1 ? 's' : ''}`;
		
		return {
			messages: [{
				role: 'agent',
				content: message
			}]
		};
	}
};
