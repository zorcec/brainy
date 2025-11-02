/**
 * Module: skills/skillScanner.ts
 *
 * Description:
 *   Singleton module for scanning and managing available skills.
 *   Supports both built-in skills (shipped with extension) and project skills (.brainy/skills).
 *   Built-in skills always take priority over project skills.
 *   Provides functions to get available skill names and refresh the skills list.
 *   Uses module-level state following the singleton pattern.
 *   Compatible with both Node.js and VS Code Web environments.
 *
 * Usage:
 *   import { getAvailableSkills, refreshSkills, isSkillAvailable } from './skills/skillScanner';
 *   
 *   await refreshSkills('/path/to/workspace');
 *   const skills = getAvailableSkills();
 *   const hasExecute = isSkillAvailable('execute');
 */

import * as vscode from 'vscode';
import { getBuiltInSkillNames, isBuiltInSkill } from './built-in';

/**
 * Singleton state for available skill names.
 * Includes both built-in skills and project-specific skills.
 * Case-sensitive skill names.
 */
let availableSkills: string[] = [];

/**
 * Singleton state for project-specific skill names only.
 * Used to detect conflicts with built-in skills.
 */
let projectSkills: string[] = [];

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
 * Gets the list of project-specific skill names only.
 * 
 * @returns Array of project skill names
 */
export function getProjectSkills(): string[] {
	return [...projectSkills];
}

/**
 * Scans the .brainy/skills directory and refreshes the available skills list.
 * Includes built-in skills and project-specific skills.
 * Built-in skills always take priority; conflicts result in console warnings.
 * Uses VS Code API for file system access, compatible with both Node.js and Web.
 * 
 * @param workspaceUri - The workspace root URI
 * @returns Array of available skill names
 */
export async function refreshSkills(workspaceUri: vscode.Uri): Promise<string[]> {
	// Start with built-in skills
	const builtInSkills = getBuiltInSkillNames();
	availableSkills = [...builtInSkills];
	projectSkills = [];

	try {
		// Use workspace URI directly
		const skillsUri = vscode.Uri.joinPath(workspaceUri, '.brainy', 'skills');
		console.log('[SkillScanner] Reading skills from:', skillsUri.toString());
		
		// Read directory using VS Code API (works in both Node and Web)
		const entries = await vscode.workspace.fs.readDirectory(skillsUri);
		console.log('[SkillScanner] Found entries:', entries.map(([name, type]) => `${name} (${type})`));
		
		// Extract skill names from .js and .ts files
		const foundProjectSkills = entries
			.filter(([name, type]) => {
				return type === vscode.FileType.File && (name.endsWith('.js') || name.endsWith('.ts'));
			})
			.map(([name, _]) => {
				// Remove extension to get skill name
				return name.replace(/\.(js|ts)$/, '');
			});
		
		// Check for conflicts with built-in skills
		for (const skillName of foundProjectSkills) {
			if (isBuiltInSkill(skillName)) {
				console.warn(
					`[SkillScanner] Warning: Project skill '${skillName}' conflicts with built-in skill. Built-in skill will take priority.`
				);
			} else {
				// Add to available skills if no conflict
				availableSkills.push(skillName);
				projectSkills.push(skillName);
			}
		}
		
		console.log(`[SkillScanner] Found ${builtInSkills.length} built-in skills and ${projectSkills.length} project skills`);
		console.log(`[SkillScanner] Total available skills:`, availableSkills);
		
	} catch (error) {
		// If directory read fails, log and continue with built-in skills only
		console.error('[SkillScanner] Error scanning skills directory:', error);
		console.error('[SkillScanner] Error details:', JSON.stringify(error, null, 2));
		// Keep built-in skills, but no project skills
		projectSkills = [];
	}

	return [...availableSkills];
}

/**
 * Resets the singleton state. Used for testing.
 */
export function resetState(): void {
	availableSkills = [];
	projectSkills = [];
}
