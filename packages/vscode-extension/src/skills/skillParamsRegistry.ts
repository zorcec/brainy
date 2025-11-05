/**
 * Module: skills/skillParamsRegistry.ts
 *
 * Description:
 *   Central registry for skill parameter definitions.
 *   Builds and maintains a map of skill names to their parameter metadata.
 *   Used by the completion provider to show only valid flags for each skill.
 *
 * Usage:
 *   import { getSkillParams, registerSkill } from './skills/skillParamsRegistry';
 *   
 *   const params = getSkillParams('file'); // Returns SkillParameter[] for file skill
 *   registerSkill(customSkill); // Register a project-specific skill
 *
 * Design:
 *   - Singleton pattern with module-level state
 *   - Initialized on extension activation
 *   - Supports both built-in and project-specific skills
 */

import type { Skill, SkillParameter } from './types';

/**
 * Registry map: skill name -> parameter definitions
 */
let skillParamsMap: Map<string, SkillParameter[]> = new Map();

/**
 * Registers a skill and its parameters in the registry.
 * If the skill has no params defined, it will be registered with an empty array.
 * 
 * @param skill - The skill to register
 */
export function registerSkill(skill: Skill): void {
	skillParamsMap.set(skill.name, skill.params || []);
}

/**
 * Registers multiple skills at once.
 * 
 * @param skills - Array of skills to register
 */
export function registerSkills(skills: Skill[]): void {
	for (const skill of skills) {
		registerSkill(skill);
	}
}

/**
 * Gets the parameter definitions for a specific skill.
 * 
 * @param skillName - Name of the skill (e.g., 'file', 'task')
 * @returns Array of parameter definitions, or undefined if skill not found
 */
export function getSkillParams(skillName: string): SkillParameter[] | undefined {
	return skillParamsMap.get(skillName);
}

/**
 * Gets all registered skill names.
 * 
 * @returns Array of all skill names in the registry
 */
export function getAllSkillNames(): string[] {
	return Array.from(skillParamsMap.keys());
}

/**
 * Clears the entire registry.
 * Primarily used for testing.
 */
export function clearRegistry(): void {
	skillParamsMap = new Map();
}

/**
 * Gets the size of the registry.
 * Primarily used for testing.
 * 
 * @returns Number of registered skills
 */
export function getRegistrySize(): number {
	return skillParamsMap.size;
}
