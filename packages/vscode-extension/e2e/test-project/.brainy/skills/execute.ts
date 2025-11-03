/**
 * Module: skills/execute.ts
 *
 * Description:
 *   Minimal "execute" skill for e2e testing (TypeScript version).
 *   Always returns a deterministic "hello world" string, regardless of input.
 *   This allows the playbook runner and e2e tests to validate TypeScript skill
 *   invocation and result handling without side effects.
 *
 * Usage:
 *   This skill is loaded and executed by the skill runner in an isolated process.
 */

/**
 * Parameters passed to skill execution.
 */
type SkillParams = Record<string, string | undefined>;

/**
 * API provided to skills.
 */
interface SkillApi {
	sendRequest(role: 'user' | 'assistant', content: string, modelId?: string): Promise<{ response: string }>;
	selectChatModel(modelId: string): Promise<void>;
}

/**
 * Skill interface.
 */
interface Skill {
	name: string;
	description: string;
	execute(api: SkillApi, params: SkillParams): Promise<string>;
}

/**
 * Execute skill implementation.
 */
export const executeSkill: Skill = {
	name: 'execute',
	description: 'Test skill that returns hello world',

	/**
	 * Always returns "hello world" string.
	 *
	 * @param api - Injected API object from the skill runner
	 * @param params - Parameters passed to the skill
	 * @returns Result string
	 */
	async execute(api: SkillApi, params: SkillParams): Promise<string> {
		return 'hello world';
	}
};

// Default export for compatibility
export default executeSkill;
