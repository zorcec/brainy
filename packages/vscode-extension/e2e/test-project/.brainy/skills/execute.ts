/**
 * Module: skills/execute.ts
 *
 * Description:
 *   Minimal "execute" skill for e2e testing (TypeScript version).
 *   Always returns a deterministic "hello world" output with exitCode 0,
 *   regardless of input. This allows the playbook runner and e2e tests to
 *   validate TypeScript skill invocation and result handling without side effects.
 *
 * Usage:
 *   import { run } from './execute';
 *   const result = await run(api, params);
 *   console.log(result); // { exitCode: 0, stdout: 'hello world', stderr: '' }
 */

/**
 * Skill execution result interface.
 */
export interface SkillResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

/**
 * Always returns hello world in stdout, exitCode: 0, empty stderr.
 *
 * @param api - Injected API object from the skill runner
 * @param params - Parameters passed to the skill
 * @returns Result object with exitCode, stdout, and stderr
 */
export async function run(api: any, params: any): Promise<SkillResult> {
	return {
		exitCode: 0, // 0 means success, non-zero means failure
		stdout: 'hello world',
		stderr: ''
	};
}
