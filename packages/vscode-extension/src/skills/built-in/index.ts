/**
 * Module: skills/built-in/index.ts
 *
 * Description:
 *   Central registry for built-in skills that ship with the extension.
 *   Built-in skills are always available and take priority over project skills.
 *
 * Usage:
 *   import { getBuiltInSkills } from './skills/built-in';
 *   const skills = getBuiltInSkills();
 *   const fileSkill = skills.get('file');
 */

import { Skill } from '../types';
import { fileSkill } from './file';

/**
 * Map of built-in skill names to skill objects.
 */
const builtInSkills = new Map<string, Skill>([
	[fileSkill.name, fileSkill]
]);

/**
 * Gets all built-in skills.
 * 
 * @returns Map of skill names to skill objects
 */
export function getBuiltInSkills(): Map<string, Skill> {
	return new Map(builtInSkills);
}

/**
 * Gets a specific built-in skill by name.
 * 
 * @param name - Skill name
 * @returns Skill object or undefined if not found
 */
export function getBuiltInSkill(name: string): Skill | undefined {
	return builtInSkills.get(name);
}

/**
 * Checks if a skill name is a built-in skill.
 * 
 * @param name - Skill name
 * @returns true if the skill is built-in
 */
export function isBuiltInSkill(name: string): boolean {
	return builtInSkills.has(name);
}

/**
 * Gets all built-in skill names.
 * 
 * @returns Array of skill names
 */
export function getBuiltInSkillNames(): string[] {
	return Array.from(builtInSkills.keys());
}
