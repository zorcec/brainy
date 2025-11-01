/**
 * Module: skills/skillRunner.ts
 *
 * Description:
 *   Skill runner singleton that loads and executes skill files (both .js and .ts).
 *   Supports TypeScript skills using ts-node for on-the-fly transpilation.
 *   Provides API injection and result handling for skill execution.
 *
 *   Skills must export an object with a `run(api, params)` async function.
 *   The runner detects the file extension and uses ts-node for .ts files.
 *
 * Usage:
 *   import { loadSkill, executeSkill } from './skills/skillRunner';
 *   const skill = await loadSkill('/path/to/skill.js');
 *   const result = await executeSkill(skill, api, params);
 *   console.log(result); // { exitCode: 0, stdout: '...', stderr: '' }
 */

/**
 * Skill module interface. Skills must export this structure.
 */
export interface SkillModule {
	run(api: any, params: any): Promise<SkillResult>;
}

/**
 * Skill execution result interface.
 */
export interface SkillResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

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
		console.log('ts-node registered for TypeScript skill support');
	} catch (error) {
		throw new Error(
			`Failed to register ts-node: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Loads a skill module from a file path.
 * Automatically handles both .js and .ts files.
 *
 * @param skillPath - Absolute path to the skill file (.js or .ts)
 * @returns Promise resolving to the skill module
 * @throws Error if the skill file cannot be loaded or doesn't export a valid run function
 */
export async function loadSkill(skillPath: string): Promise<SkillModule> {
	if (!skillPath || typeof skillPath !== 'string') {
		throw new Error('Skill path must be a non-empty string');
	}

	// Register ts-node if loading a TypeScript file
	if (skillPath.endsWith('.ts')) {
		registerTsNode();
	}

	try {
		// Load the skill module
		// Note: In a browser/web environment, this won't work.
		// This is designed for Node.js environments (e2e tests, local development)
		const skill = require(skillPath);

		// Validate that the skill exports a run function
		if (!skill || typeof skill.run !== 'function') {
			throw new Error(
				`Skill at ${skillPath} must export an object with a run(api, params) function`
			);
		}

		return skill as SkillModule;
	} catch (error) {
		throw new Error(
			`Failed to load skill from ${skillPath}: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Executes a loaded skill with the provided API and parameters.
 *
 * @param skill - The loaded skill module
 * @param api - API object to inject into the skill
 * @param params - Parameters to pass to the skill
 * @returns Promise resolving to the skill execution result
 * @throws Error if skill execution fails
 */
export async function executeSkill(
	skill: SkillModule,
	api: any,
	params: any
): Promise<SkillResult> {
	if (!skill || typeof skill.run !== 'function') {
		throw new Error('Invalid skill: must have a run function');
	}

	try {
		const result = await skill.run(api, params);

		// Validate result structure
		if (
			typeof result !== 'object' ||
			result === null ||
			typeof result.exitCode !== 'number' ||
			typeof result.stdout !== 'string' ||
			typeof result.stderr !== 'string'
		) {
			throw new Error(
				'Skill must return an object with exitCode (number), stdout (string), and stderr (string)'
			);
		}

		return result;
	} catch (error) {
		throw new Error(
			`Skill execution failed: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

/**
 * Convenience function to load and execute a skill in one call.
 *
 * @param skillPath - Absolute path to the skill file (.js or .ts)
 * @param api - API object to inject into the skill
 * @param params - Parameters to pass to the skill
 * @returns Promise resolving to the skill execution result
 */
export async function runSkill(
	skillPath: string,
	api: any,
	params: any
): Promise<SkillResult> {
	const skill = await loadSkill(skillPath);
	return await executeSkill(skill, api, params);
}

/**
 * Resets the skill runner state. Used for testing.
 */
export function resetSkillRunner(): void {
	tsNodeRegistered = false;
}
