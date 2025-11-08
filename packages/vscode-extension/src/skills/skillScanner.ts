/**
 * Module: skills/skillScanner.ts
 *
 * Description:
 *   Singleton module for managing available skills (built-in + local).
 *   Scans for local skills in the .skills/ folder of the workspace.
 *   Provides functions to get available skill names.
 *   Uses module-level state following the singleton pattern.
 *
 * Usage:
 *   import { getAvailableSkills, refreshSkills, isSkillAvailable, scanLocalSkills } from './skills/skillScanner';
 *   
 *   refreshSkills(workspaceRoot);
 *   const skills = getAvailableSkills();
 *   const hasExecute = isSkillAvailable('execute');
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { getBuiltInSkillNames, isBuiltInSkill } from './built-in';

/**
 * Singleton state for available skill names.
 * Includes built-in and local skills.
 * Case-sensitive skill names.
 */
let availableSkills: string[] = [];

/**
 * Singleton state for local skill names only.
 */
let localSkills: string[] = [];

/**
 * File system watcher for local skills.
 */
let skillWatcher: vscode.FileSystemWatcher | undefined;

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
 * Refreshes the available skills list with built-in and local skills.
 * 
 * @param workspaceRoot - Optional workspace root path for scanning local skills
 * @returns Array of available skill names
 */
export function refreshSkills(workspaceRoot?: string): string[] {
	// Always include built-in skills
	const builtIn = getBuiltInSkillNames();
	
	// Scan for local skills if workspace root is provided
	const local = workspaceRoot ? scanLocalSkills(workspaceRoot) : [];
	localSkills = local;
	
	// Combine built-in and local (built-in takes priority)
	availableSkills = [...builtIn, ...local];
	
	return [...availableSkills];
}

/**
 * Scans the .skills/ folder for local TypeScript skill files.
 * Uses synchronous Node.js fs for compatibility with current architecture.
 * 
 * @param workspaceRoot - Workspace root path
 * @returns Array of local skill names
 */
export function scanLocalSkills(workspaceRoot: string): string[] {
	const skillsDir = path.join(workspaceRoot, '.skills');
	
	try {
		// Use Node.js fs (synchronous)
		const fs = require('fs');
		if (!fs.existsSync(skillsDir)) {
			return [];
		}
		return fs.readdirSync(skillsDir)
			.filter((f: string) => f.endsWith('.ts'))
			.map((f: string) => path.basename(f, '.ts'));
	} catch (err) {
		// Silently fail if directory doesn't exist or can't be read
		return [];
	}
}

/**
 * Watches the .skills/ folder for changes and refreshes skills list.
 * 
 * @param workspaceRoot - Workspace root path
 * @param onChange - Callback to invoke when skills change
 * @returns File system watcher (must be disposed)
 */
export function watchSkillFiles(workspaceRoot: string, onChange: () => void): vscode.FileSystemWatcher {
	const skillsDir = path.join(workspaceRoot, '.skills');
	const pattern = new vscode.RelativePattern(skillsDir, '*.ts');
	const watcher = vscode.workspace.createFileSystemWatcher(pattern);
	
	watcher.onDidCreate(onChange);
	watcher.onDidChange(onChange);
	watcher.onDidDelete(onChange);
	
	return watcher;
}

/**
 * Gets the list of local skill names only.
 * 
 * @returns Array of local skill names
 */
export function getLocalSkills(): string[] {
	return [...localSkills];
}

/**
 * Checks if a skill is a local skill.
 * 
 * @param skillName - The skill name to check
 * @returns true if the skill is a local skill
 */
export function isLocalSkill(skillName: string): boolean {
	return localSkills.includes(skillName);
}

/**
 * Resets the scanner state. Used for testing.
 */
export function resetSkillScanner(): void {
	availableSkills = [];
	localSkills = [];
	if (skillWatcher) {
		skillWatcher.dispose();
		skillWatcher = undefined;
	}
}
