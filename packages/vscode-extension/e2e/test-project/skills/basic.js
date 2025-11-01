/**
 * Module: skills/basic.js
 *
 * Description:
 *   Minimal "basic" skill for e2e testing. Always returns a deterministic
 *   "hello world" output with exitCode 0, regardless of input.
 *   This allows the playbook runner and e2e tests to validate skill invocation
 *   and result handling without side effects.
 *
 * Usage:
 *   const skill = require('./basic.js');
 *   const result = await skill.run(api, params);
 *   console.log(result); // { exitCode: 0, stdout: 'hello world', stderr: '' }
 */

module.exports = {
    /**
     * Always returns hello world in stdout, exitCode: 0, empty stderr.
     *
     * @param {object} api - Injected API object from the skill runner
     * @param {object} params - Parameters passed to the skill
     * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>} Result object
     */
    async run(api, params) {
        return {
            exitCode: 0, // 0 means success, non-zero means failure
            stdout: 'hello world',
            stderr: ''
        };
    }
};
