/**
 * Module: skills/skillScanner.ts
 *
 * Description:
 *   Singleton module for scanning and managing available skills from the .brainy/skills directory.
 *   Provides functions to get available skill names and refresh the skills list.
 *   Uses module-level state following the singleton pattern.
 *   Compatible with both Node.js and VS Code Web environments.
 *
 * Usage:
 *   import { getAvailableSkills, refreshSkills, isSkillAvailable } from './skills/skillScanner';
 *   
 *   refreshSkills('/path/to/workspace');
 *   const skills = getAvailableSkills();
 *   const hasExecute = isSkillAvailable('execute');
 */

import * as vscode from 'vscode';

/**
 * Singleton state for available skill names.
 * Case-sensitive skill names derived from filenames in .brainy/skills directory.
 */
let availableSkills: string[] = [];

/**
 * Gets the list of available skill names (case-sensitive).
 * 
 * @returns Array of skill names
 */
export function getAvailableSkills(): string[] {
	return [...availableSkills];
}

/**
 * Checks if a skill is available (case-sensitive).
 * 
 * @param skillName - The skill name to check
 * @returns true if the skill is available
 */
export function isSkillAvailable(skillName: string): boolean {
	return availableSkills.includes(skillName);
}

/**
 * Scans the .brainy/skills directory and refreshes the available skills list.
 * Uses VS Code API for file system access, compatible with both Node.js and Web.
 * 
 * @param workspaceUri - The workspace root URI
 * @returns Array of available skill names
 */
export async function refreshSkills(workspaceUri: vscode.Uri): Promise<string[]> {
	// Reset available skills
	availableSkills = [];

	try {
		// Use workspace URI directly
		const skillsUri = vscode.Uri.joinPath(workspaceUri, '.brainy', 'skills');
		console.log('[SkillScanner] Reading skills from:', skillsUri.toString());
		
		// Read directory using VS Code API (works in both Node and Web)
		const entries = await vscode.workspace.fs.readDirectory(skillsUri);
		console.log('[SkillScanner] Found entries:', entries.map(([name, type]) => `${name} (${type})`));
		
		// Extract skill names from .js and .ts files
		availableSkills = entries
			.filter(([name, type]) => {
				return type === vscode.FileType.File && (name.endsWith('.js') || name.endsWith('.ts'));
			})
			.map(([name, _]) => {
				// Remove extension to get skill name
				return name.replace(/\.(js|ts)$/, '');
			});
			
		console.log(`[SkillScanner] Found ${availableSkills.length} skills:`, availableSkills);
		
	} catch (error) {
		// If directory read fails, log and continue with empty list
		console.error('[SkillScanner] Error scanning skills directory:', error);
		console.error('[SkillScanner] Error details:', JSON.stringify(error, null, 2));
		availableSkills = [];
	}

	return [...availableSkills];
}

/**
 * Resets the singleton state. Used for testing.
 */
export function resetState(): void {
	availableSkills = [];
}
