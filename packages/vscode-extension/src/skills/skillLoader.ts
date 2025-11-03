/**
 * Module: skills/skillLoader.ts
 *
 * Description:
 *   Skill loader for loading and executing skills using the new Skill API.
 *   Supports both built-in skills (shipped with extension) and project skills (.brainy/skills).
 *   Built-in skills always take priority over project skills.
 *   Project skills are dynamically loaded from .js and .ts files.
 *
 * Usage:
 *   import { loadSkill, executeSkill } from './skills/skillLoader';
 *   
 *   const skill = await loadSkill('file', workspaceUri);
 *   const result = await executeSkill(skill, { action: 'read', path: './test.txt' });
 */

import * as vscode from 'vscode';
import { Skill, SkillParams } from './types';
import { getBuiltInSkill, isBuiltInSkill } from './built-in';
import { createSkillApi } from './skillApi';

/**
 * Tracks whether ts-node has been registered for TypeScript support.
 */
let tsNodeRegistered = false;

/**
 * Registers ts-node for TypeScript support if not already registered.
 * This allows Node.js to require .ts files directly.
 */
function registerTsNode(): void {
	if (tsNodeRegistered) {
		return;
	}

	try {
		// Register ts-node to enable TypeScript file execution
		require('ts-node/register');
		tsNodeRegistered = true;
		console.log('[SkillLoader] ts-node registered for TypeScript skill support');
	} catch (error) {
		throw new Error(
			`Failed to register ts-node: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Loads a skill by name.
 * First checks built-in skills, then attempts to load from project's .brainy/skills directory.
 *
 * @param skillName - Name of the skill to load
 * @param workspaceUri - Workspace root URI (required for project skills)
 * @returns Promise resolving to the skill object
 * @throws Error if the skill cannot be found or loaded
 */
export async function loadSkill(skillName: string, workspaceUri?: vscode.Uri): Promise<Skill> {
	if (!skillName || typeof skillName !== 'string') {
		throw new Error('Skill name must be a non-empty string');
	}

	// Check built-in skills first
	const builtInSkill = getBuiltInSkill(skillName);
	if (builtInSkill) {
		return builtInSkill;
	}

	// Attempt to load from project skills
	if (!workspaceUri) {
		throw new Error(`Skill '${skillName}' not found. No workspace URI provided for project skills.`);
	}

	return await loadProjectSkill(skillName, workspaceUri);
}

/**
 * Loads a project skill from .brainy/skills directory.
 * Supports both .js and .ts files.
 *
 * @param skillName - Name of the skill to load
 * @param workspaceUri - Workspace root URI
 * @returns Promise resolving to the skill object
 * @throws Error if the skill cannot be found or loaded
 */
async function loadProjectSkill(skillName: string, workspaceUri: vscode.Uri): Promise<Skill> {
	// Try .ts first, then .js
	const extensions = ['.ts', '.js'];
	
	for (const ext of extensions) {
		const skillPath = vscode.Uri.joinPath(workspaceUri, '.brainy', 'skills', `${skillName}${ext}`).fsPath;
		
		try {
			// Check if file exists
			const fileUri = vscode.Uri.file(skillPath);
			await vscode.workspace.fs.stat(fileUri);
			
			// Register ts-node if loading a TypeScript file
			if (ext === '.ts') {
				registerTsNode();
			}
			
			// Load the skill module
			// Note: This won't work in browser/web environments
			// Clear require cache to support hot-reloading
			delete require.cache[require.resolve(skillPath)];
			const module = require(skillPath);
			
			// Extract the skill object
			// Support both default export and named exports
			const skill = module.default || module[`${skillName}Skill`] || module;
			
			// Validate the skill object
			if (!skill || typeof skill !== 'object') {
				throw new Error(`Skill module at ${skillPath} must export a Skill object`);
			}
			
			if (!skill.name || typeof skill.name !== 'string') {
				throw new Error(`Skill at ${skillPath} must have a 'name' property (string)`);
			}
			
			if (!skill.description || typeof skill.description !== 'string') {
				throw new Error(`Skill at ${skillPath} must have a 'description' property (string)`);
			}
			
			if (!skill.execute || typeof skill.execute !== 'function') {
				throw new Error(`Skill at ${skillPath} must have an 'execute' property (async function)`);
			}
			
			return skill as Skill;
			
		} catch (error) {
			// If file doesn't exist, try next extension
			if ((error as any).code === 'FileNotFound') {
				continue;
			}
			
			// Other errors should be thrown
			throw new Error(
				`Failed to load project skill '${skillName}' from ${skillPath}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
	
	// Skill not found
	throw new Error(`Skill '${skillName}' not found in .brainy/skills directory`);
}

/**
 * Executes a skill with the provided parameters.
 *
 * @param skill - The skill to execute
 * @param params - Parameters to pass to the skill
 * @returns Promise resolving to the skill result (string)
 * @throws Error if skill execution fails
 */
export async function executeSkill(skill: Skill, params: SkillParams): Promise<string> {
	if (!skill || typeof skill.execute !== 'function') {
		throw new Error('Invalid skill: must have an execute function');
	}

	try {
		// Create and inject SkillApi
		const api = createSkillApi();
		const result = await skill.execute(api, params);
		
		// Validate result
		if (typeof result !== 'string') {
			throw new Error('Skill execute function must return a string');
		}
		
		return result;
	} catch (error) {
		throw new Error(
			`Skill '${skill.name}' execution failed: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Convenience function to load and execute a skill in one call.
 *
 * @param skillName - Name of the skill to execute
 * @param params - Parameters to pass to the skill
 * @param workspaceUri - Workspace root URI (required for project skills)
 * @returns Promise resolving to the skill result (string)
 */
export async function runSkill(
	skillName: string,
	params: SkillParams,
	workspaceUri?: vscode.Uri
): Promise<string> {
	const skill = await loadSkill(skillName, workspaceUri);
	return await executeSkill(skill, params);
}

/**
 * Resets the skill loader state. Used for testing.
 */
export function resetSkillLoader(): void {
	tsNodeRegistered = false;
	// Clear require cache for all project skills
	// This is a best-effort approach; requires careful testing
}
