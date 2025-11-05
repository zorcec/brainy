/**
 * Module: skills/built-in/index.ts
 *
 * Description:
 *   Registry for built-in skills that ship with the extension.
 *   Built-in skills are always available and take priority over project skills.
 *   Skills are not loaded here - they run in isolated processes.
 *   This module only tracks which skills are built-in.
 *
 * Usage:
 *   import { isBuiltInSkill } from './skills/built-in';
 *   if (isBuiltInSkill('file')) { ... }
 */

/**
 * Set of built-in skill names.
 */
const builtInSkillNames = new Set<string>([
	'file',
	'model',
	'context',
	'task',
	'execute',
	'input'
]);

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
