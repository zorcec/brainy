/**
 * Module: skills/skillLoader.ts
 *
 * Description:
 *   Skill loader for loading and executing built-in and local skills in-process.
 *   Supports built-in skills (shipped with extension) and local skills (.skills/ folder).
 *   Skills execute synchronously in the same process as the extension.
 *
 * Usage:
 *   import { loadSkill, executeSkill } from './skills/skillLoader';
 *   
 *   const skill = await loadSkill('file', workspaceRoot);
 *   const result = await executeSkill(skill, { action: 'read', path: './test.txt' });
 */

import * as path from 'path';
import { SkillParams, SkillResult, Skill } from './types';
import { isBuiltInSkill, getBuiltInSkill } from './built-in';
import { createSkillApi } from './skillApi';
import { isLocalSkill } from './skillScanner';
import type { AnnotationBlock } from '../parser';
import { transpileSkill } from './transpiler';


/**
 * Loads a skill (built-in or local) by name.
 *
 * @param skillName - Name of the skill to load
 * @param workspaceRoot - Optional workspace root path for loading local skills
 * @returns Promise resolving to the skill instance
 * @throws Error if the skill cannot be found or loaded
 */
export async function loadSkill(skillName: string, workspaceRoot?: string): Promise<Skill> {
	if (!skillName || typeof skillName !== 'string') {
		throw new Error('Skill name must be a non-empty string');
	}

	// Check built-in skills first (priority)
	if (isBuiltInSkill(skillName)) {
		const skill = getBuiltInSkill(skillName);
		if (!skill) {
			throw new Error(`Built-in skill '${skillName}' is registered but not found.`);
		}
		return skill;
	}

	// Check local skills if workspace root is provided
	if (workspaceRoot && isLocalSkill(skillName)) {
		return await loadLocalSkill(skillName, workspaceRoot);
	}

	throw new Error(`Skill '${skillName}' not found. Check that the skill exists in built-in skills or .skills/ folder.`);
}

/**
 * Loads a local skill from the .skills/ folder.
 * Transpiles TypeScript to JavaScript and evaluates it.
 *
 * @param skillName - Name of the local skill
 * @param workspaceRoot - Workspace root path
 * @returns Promise resolving to the skill instance
 * @throws Error if the skill file cannot be read, transpiled, or evaluated
 */
async function loadLocalSkill(skillName: string, workspaceRoot: string): Promise<Skill> {
	const skillPath = path.join(workspaceRoot, '.skills', `${skillName}.ts`);
	
	try {
		// Read the skill file
		const fs = require('fs');
		if (!fs.existsSync(skillPath)) {
			throw new Error(`Skill file not found: ${skillPath}`);
		}
		
		const tsCode = fs.readFileSync(skillPath, 'utf8');
		
		// Transpile TypeScript to JavaScript
		const jsCode = transpileSkill(tsCode);
		
		// Evaluate the skill code
		// The skill must export a skill object with name, description, and execute
		const module: any = { exports: {} };
		const exports = module.exports;
		
		// Create a wrapper function to capture exports
		const wrappedCode = `(function(module, exports) { ${jsCode} })`;
		const fn = eval(wrappedCode);
		fn(module, exports);
		
		// Extract the skill object
		// Skills can export as: export const mySkill = { ... } or module.exports = { ... }
		let skill: Skill | undefined;
		
		// Check for named exports (export const skillName = ...)
		if (module.exports && typeof module.exports === 'object') {
			const exportedValues = Object.values(module.exports);
			skill = exportedValues.find(val => 
				val && typeof val === 'object' && 'execute' in val
			) as Skill | undefined;
		}
		
		if (!skill || typeof skill.execute !== 'function') {
			throw new Error(`Invalid skill: must export an object with an execute function`);
		}
		
		return skill;
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		throw new Error(`Failed to load local skill '${skillName}': ${errorMessage}`);
	}
}

/**
 * Executes a loaded skill with given parameters.
 * Creates a SkillApi instance and passes it to the skill's execute function.
 * Now supports passing blocks and currentIndex for skills that need access to the playbook context.
 *
 * @param skill - The skill to execute
 * @param params - Parameters to pass to the skill
 * @param blocks - Optional array of all parsed blocks from the playbook
 * @param currentIndex - Optional index of the currently executing block
 * @returns Promise resolving to the skill result (SkillResult object)
 * @throws Error if skill execution fails
 */
export async function executeSkill(
	skill: Skill,
	params: SkillParams,
	blocks?: AnnotationBlock[],
	currentIndex?: number
): Promise<SkillResult> {
	if (!skill || !skill.execute) {
		throw new Error('Invalid skill: must have an execute function');
	}

	// Create the API instance for this skill execution
	// Pass blocks and currentIndex if provided, otherwise use defaults
	const api = createSkillApi(blocks || [], currentIndex || 0);

	// Execute the skill in-process
	return await skill.execute(api, params);
}

/**
 * Convenience function to load and execute a skill in one call.
 *
 * @param skillName - Name of the skill to execute
 * @param params - Parameters to pass to the skill
 * @param workspaceRoot - Optional workspace root path for loading local skills
 * @returns Promise resolving to the skill result (SkillResult object)
 */
export async function runSkill(
	skillName: string,
	params: SkillParams,
	workspaceRoot?: string
): Promise<SkillResult> {
	const skill = await loadSkill(skillName, workspaceRoot);
	return await executeSkill(skill, params);
}

/**
 * Resets the skill loader state. Used for testing.
 */
export function resetSkillLoader(): void {
	// No state to reset in the new implementation
}

/**
 * Validates a local skill file without executing it.
 * Used for error checking and hover tooltips.
 *
 * @param skillName - Name of the local skill
 * @param workspaceRoot - Workspace root path
 * @returns Validation result with success flag and error message if failed
 */
export function validateLocalSkill(skillName: string, workspaceRoot: string): { 
	valid: boolean; 
	error?: string;
	stack?: string;
} {
	const skillPath = path.join(workspaceRoot, '.skills', `${skillName}.ts`);
	
	try {
		// Read the skill file
		const fs = require('fs');
		if (!fs.existsSync(skillPath)) {
			return { valid: false, error: `Skill file not found: ${skillPath}` };
		}
		
		const tsCode = fs.readFileSync(skillPath, 'utf8');
		
		// Transpile TypeScript to JavaScript
		const jsCode = transpileSkill(tsCode);
		
		// Evaluate the skill code
		const module: any = { exports: {} };
		const exports = module.exports;
		
		const wrappedCode = `(function(module, exports) { ${jsCode} })`;
		const fn = eval(wrappedCode);
		fn(module, exports);
		
		// Check for valid skill export
		if (module.exports && typeof module.exports === 'object') {
			const exportedValues = Object.values(module.exports);
			const skill = exportedValues.find(val => 
				val && typeof val === 'object' && 'execute' in val
			);
			
			if (!skill || typeof (skill as any).execute !== 'function') {
				return { 
					valid: false, 
					error: 'Invalid skill: must export an object with an execute function'
				};
			}
		} else {
			return { 
				valid: false, 
				error: 'Invalid skill: must export an object with an execute function'
			};
		}
		
		return { valid: true };
	} catch (err) {
		const error = err instanceof Error ? err.message : String(err);
		const stack = err instanceof Error ? err.stack : undefined;
		return { valid: false, error, stack };
	}
}
