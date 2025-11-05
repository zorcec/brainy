/**
 * Module: skills/built-in/index.ts
 *
 * Description:
 *   Registry for built-in skills that ship with the extension.
 *   Built-in skills are always available and take priority over project skills.
 *   Provides access to skill metadata and instances.
 *
 * Usage:
 *   import { isBuiltInSkill, getBuiltInSkill } from './skills/built-in';
 *   if (isBuiltInSkill('file')) { ... }
 *   const skill = getBuiltInSkill('context');
 */

import type { Skill } from '../types';
import { contextSkill } from './context';
import { modelSkill } from './model';
import { taskSkill } from './task';
import { executeSkill } from './execute';
import { fileSkill } from './file';
import { inputSkill } from './input';

/**
 * Map of built-in skill instances.
 */
const builtInSkills = new Map<string, Skill>([
	['context', contextSkill],
	['model', modelSkill],
	['task', taskSkill],
	['execute', executeSkill],
	['file', fileSkill],
	['input', inputSkill]
]);

/**
 * Set of built-in skill names.
 */
const builtInSkillNames = new Set<string>(builtInSkills.keys());

/**
 * Checks if a skill name is a built-in skill.
 * 
 * @param name - Skill name
 * @returns true if the skill is built-in
 */
export function isBuiltInSkill(name: string): boolean {
	return builtInSkillNames.has(name);
}

/**
 * Gets all built-in skill names.
 * 
 * @returns Array of skill names
 */
export function getBuiltInSkillNames(): string[] {
	return Array.from(builtInSkillNames);
}

/**
 * Gets a built-in skill instance by name.
 * 
 * @param name - Skill name
 * @returns Skill instance or undefined
 */
export function getBuiltInSkill(name: string): Skill | undefined {
	return builtInSkills.get(name);
}

/**
 * Gets all built-in skill instances.
 * 
 * @returns Array of all built-in skills
 */
export function getAllBuiltInSkills(): Skill[] {
	return Array.from(builtInSkills.values());
}
