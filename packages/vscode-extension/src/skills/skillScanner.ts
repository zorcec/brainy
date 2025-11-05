/**
 * Module: skills/skillScanner.ts
 *
 * Description:
 *   Singleton module for managing available built-in skills.
 *   Only supports built-in skills (shipped with extension).
 *   Provides functions to get available skill names.
 *   Uses module-level state following the singleton pattern.
 *
 * Usage:
 *   import { getAvailableSkills, refreshSkills, isSkillAvailable } from './skills/skillScanner';
 *   
 *   refreshSkills();
 *   const skills = getAvailableSkills();
 *   const hasExecute = isSkillAvailable('execute');
 */

import { getBuiltInSkillNames, isBuiltInSkill } from './built-in';

/**
 * Singleton state for available skill names.
 * Only includes built-in skills.
 * Case-sensitive skill names.
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
 * Refreshes the available skills list with built-in skills.
 * 
 * @returns Array of available skill names
 */
export function refreshSkills(): string[] {
	// Only built-in skills are supported
	availableSkills = getBuiltInSkillNames();
	return [...availableSkills];
}

/**
 * Resets the scanner state. Used for testing.
 */
export function resetSkillScanner(): void {
	availableSkills = [];
}
