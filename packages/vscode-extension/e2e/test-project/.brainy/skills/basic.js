/**
 * Module: skills/basic.js
 *
 * Description:
 *   Minimal "basic" skill for e2e testing. Always returns a deterministic
 *   "hello world" string in a messages array, regardless of input.
 *   This allows the playbook runner and e2e tests to validate skill invocation
 *   and result handling without side effects.
 *
 * Usage:
 *   This skill is loaded and executed by the skill runner in an isolated process.
 */

module.exports = {
    name: 'basic',
    description: 'Test skill that returns hello world',
    
    /**
     * Always returns a SkillResult object with "hello world" message.
     *
     * @param {object} api - Injected API object from the skill runner
     * @param {object} params - Parameters passed to the skill
     * @returns {Promise<object>} Result object with messages array
     */
    async execute(api, params) {
        return {
            messages: [{
                role: 'assistant',
                content: 'hello world'
            }]
        };
    }
};
