/**
 * Module: skills/types.ts
 *
 * Description:
 *   Core type definitions for the Brainy Skills API.
 *   Defines the Skill interface that all skills must implement.
 *   Skills can be built-in (shipped with the extension) or project-specific (.brainy/skills).
 *
 * Usage:
 *   import { Skill, SkillParams } from './skills/types';
 *   
 *   export const mySkill: Skill = {
 *     name: 'my-skill',
 *     description: 'Does something useful',
 *     async execute(params) {
 *       return 'result string';
 *     }
 *   };
 */

/**
 * Parameters passed to skill execution.
 * Flags from annotations are translated into this object.
 * Example: @file --action "read" --path "./test.json"
 * Results in: { action: "read", path: "./test.json" }
 */
export type SkillParams = Record<string, string | undefined>;

/**
 * Skill interface that all skills must implement.
 * 
 * Skills are modular, async functions that can be invoked from markdown playbooks.
 * Each skill has a unique name (derived from filename), a description, and an execute function.
 * 
 * @example
 * ```ts
 * export const fileSkill: Skill = {
 *   name: 'file',
 *   description: 'Read, write and delete files.',
 *   async execute(params) {
 *     const { action, path, content } = params;
 *     // Implementation logic here
 *     return '<result>';
 *   }
 * };
 * ```
 */
export interface Skill {
	/**
	 * Unique skill identifier.
	 * Typically derived from the filename (e.g., 'file' from file.ts).
	 */
	name: string;

	/**
	 * Brief description of what the skill does.
	 * Used for documentation and UI tooltips.
	 */
	description: string;

	/**
	 * Executes the skill with the provided parameters.
	 * 
	 * @param params - Parameters from annotation flags (e.g., { action: 'read', path: './file.txt' })
	 * @returns Promise resolving to a string result
	 * @throws Error on failure (exception message will be shown in UI)
	 */
	execute(params: SkillParams): Promise<string>;
}
