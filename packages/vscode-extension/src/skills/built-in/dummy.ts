/**
 * Module: skills/built-in/dummy.ts
 *
 * Description:
 *   Dummy skill for testing purposes.
 *   Used to test skill registration, tool registration, highlighting, tooltips, errors,
 *   and LLM tool availability without affecting real skills.
 *   Provides various test modes via the 'mode' parameter.
 *
 * Usage in playbooks:
 *   @dummy --mode success --message "Test message"
 *   @dummy --mode error
 *   @dummy --mode slow --delay 2000
 *
 * Parameters:
 *   - mode: Test mode (success|error|slow) (optional, default: success)
 *   - message: Custom message for success mode (optional)
 *   - delay: Delay in milliseconds for slow mode (optional, default: 1000)
 *
 * Behavior:
 *   - success mode: Returns a success message immediately
 *   - error mode: Throws an error to test error handling
 *   - slow mode: Delays execution to test timeouts and async behavior
 */

import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

/**
 * Dummy skill implementation for testing.
 */
export const dummySkill: Skill = {
	name: 'dummy',
	description: 'Dummy skill for testing. Supports multiple modes: success, error, slow.',
	params: [
		{ name: 'mode', description: 'Test mode: success, error, or slow', required: false },
		{ name: 'message', description: 'Custom message for success mode', required: false },
		{ name: 'delay', description: 'Delay in milliseconds for slow mode', required: false }
	],
	registerAsTool: true, // Register as LLM tool for testing
	
	async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
		const mode = params.mode || 'success';
		const message = params.message || 'Dummy skill executed successfully';
		const delay = parseInt(params.delay as string) || 1000;
		
		switch (mode) {
			case 'error':
				throw new Error('Dummy skill error (intentional for testing)');
			
			case 'slow':
				// Simulate slow execution
				await new Promise(resolve => setTimeout(resolve, delay));
				return {
					messages: [{
						role: 'agent',
						content: `Dummy skill completed after ${delay}ms delay`
					}]
				};
			
			case 'success':
			default:
				return {
					messages: [{
						role: 'agent',
						content: message
					}]
				};
		}
	}
};
