/**
 * Module: skills/skillLoader.ts
 *
 * Description:
 *   Skill loader for loading and executing built-in skills in-process.
 *   Only supports built-in skills (shipped with extension).
 *   Skills execute synchronously in the same process as the extension.
 *
 * Usage:
 *   import { loadSkill, executeSkill } from './skills/skillLoader';
 *   
 *   const skill = await loadSkill('file');
 *   const result = await executeSkill(skill, { action: 'read', path: './test.txt' });
 */

import { SkillParams, SkillResult, Skill } from './types';
import { isBuiltInSkill, getBuiltInSkill } from './built-in';
import { createSkillApi } from './skillApi';


/**
 * Loads a built-in skill by name.
 *
 * @param skillName - Name of the skill to load
 * @returns Promise resolving to the skill instance
 * @throws Error if the skill cannot be found
 */
export async function loadSkill(skillName: string): Promise<Skill> {
	if (!skillName || typeof skillName !== 'string') {
		throw new Error('Skill name must be a non-empty string');
	}

	// Check built-in skills
	if (!isBuiltInSkill(skillName)) {
		throw new Error(`Skill '${skillName}' not found. Only built-in skills are supported.`);
	}

	const skill = getBuiltInSkill(skillName);
	if (!skill) {
		throw new Error(`Built-in skill '${skillName}' is registered but not found.`);
	}

	return skill;
}

/**
 * Executes a skill in-process.
 *
 * @param skill - The skill instance from loadSkill
 * @param params - Parameters to pass to the skill
 * @returns Promise resolving to the skill result (SkillResult object)
 * @throws Error if skill execution fails
 */
export async function executeSkill(
	skill: Skill,
	params: SkillParams
): Promise<SkillResult> {
	if (!skill || !skill.execute) {
		throw new Error('Invalid skill: must have an execute function');
	}

	// Create the API instance for this skill execution
	const api = createSkillApi();

	// Execute the skill in-process
	return await skill.execute(api, params);
}

/**
 * Convenience function to load and execute a skill in one call.
 *
 * @param skillName - Name of the skill to execute
 * @param params - Parameters to pass to the skill
 * @returns Promise resolving to the skill result (SkillResult object)
 */
export async function runSkill(
	skillName: string,
	params: SkillParams
): Promise<SkillResult> {
	const skill = await loadSkill(skillName);
	return await executeSkill(skill, params);
}

/**
 * Resets the skill loader state. Used for testing.
 */
export function resetSkillLoader(): void {
	// No state to reset in the new implementation
}

