/**
 * Module: skills/execute.ts
 *
 * Description:
 *   Minimal "execute" skill for e2e testing (TypeScript version).
 *   Always returns a deterministic "hello world" message in SkillResult format.
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
 * Message structure for skill results.
 */
interface SkillMessage {
	role: 'user' | 'assistant' | 'agent';
	content: string;
}

/**
 * Result object returned by skill execution.
 */
interface SkillResult {
	messages: SkillMessage[];
}

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
	execute(api: SkillApi, params: SkillParams): Promise<SkillResult>;
}

/**
 * Execute skill implementation.
 */
export const executeSkill: Skill = {
	name: 'execute',
	description: 'Test skill that returns hello world',

	/**
	 * Always returns a SkillResult object with "hello world" message.
	 *
	 * @param api - Injected API object from the skill runner
	 * @param params - Parameters passed to the skill
	 * @returns Result object with messages array
	 */
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		return {
			messages: [{
				role: 'agetnt',
				content: 'hello world'
			}]
		};
	}
};

// Default export for compatibility
export default executeSkill;
