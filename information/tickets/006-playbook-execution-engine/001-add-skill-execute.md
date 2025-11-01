## Title
Add skill "execute" to playbook skills

## Problem
Playbooks reference an `@execute` skill but the repository lacks a canonical skill implementation and example for the e2e test-project. Without it, integration and e2e tests cannot validate skill invocation or runner behavior.

## Solution
Add a minimal `execute` skill that always returns `stdout: 'hello world'`, `exitCode: 0`, and empty `stderr`, regardless of input. This allows the playbook runner and e2e tests to validate skill invocation and result handling deterministically.

## Proposal
- Place a simple skill script at `packages/vscode-extension/e2e/test-project/skills/basic.js` (the repo's e2e test-project is under `packages/vscode-extension/e2e/test-project`).
- The skill must export an object with a single async `run(api, params)` function. The extension/playbook runner will inject the API and call `run`.
- The skill always returns `{ exitCode: 0, stdout: 'hello world', stderr: '' }` regardless of input. No code execution, error handling, or language validation is performed.
- This deterministic output allows the runner and e2e tests to validate skill invocation and result handling without side effects.


## Acceptance Criteria
- [ ] `basic` skill script exists at `packages/vscode-extension/e2e/test-project/skills/basic.js` and exports `{ run(api, params) }`.
- [ ] The playbook runner can spawn the skill process, call `run`, and receive `{ exitCode: 0, stdout: 'hello world', stderr: '' }`.
- [ ] The skill always returns the same output, regardless of input.

## Tasks/Subtasks
- [ ] Add `basic` skill script to `packages/vscode-extension/e2e/test-project/skills/basic.js` implementing the exported-run contract (exports `{ run(api, params) }`) and always returning `{ exitCode: 0, stdout: 'hello world', stderr: '' }`.
- [ ] Ensure the playbook runner used by e2e tests spawns the skill process and calls `run`.
- [ ] Add a minimal example playbook in `packages/vscode-extension/e2e/test-project/` that uses the `@execute` annotation and is referenced by e2e tests.
- [ ] Add e2e test that confirms skill highlighting works and the output is always 'hello world'.

## Implementation example

Below is a minimal example `basic` skill that matches the injected-API / exported-run contract. Place this file at `packages/vscode-extension/e2e/test-project/skills/basic.js`.

```javascript
// Minimal hello world execute skill for e2e tests
module.exports = {
	/**
	 * Always returns hello world in stdout, exitCode: 0, empty stderr.
	 */
	async run(api, params) {
		return {
			exitCode: 0, // if not 0 it failed
			stdout: 'hello world',
			stderr: ''
		};
	}
};
```

### Bootstrap note

The runner may use a generic bootstrap to load the skill module and forward IPC messages (`inject-api`, `run`) to the exported function, or the skill file itself may wire process messages to its exported `run`. For this minimal skill, only the exported function is required.

## Open Questions
- Confirm preferred invocation mechanism for the playbook runner in tests: IPC messages (recommended) vs. CLI args or HTTP. I recommend IPC to match the existing injected-API model.

## Additional Info
- Keep the skill intentionally simple and deterministic to match the epic's scope.

## References
- Epic: Playbook Execution Engine (../epic.md)
