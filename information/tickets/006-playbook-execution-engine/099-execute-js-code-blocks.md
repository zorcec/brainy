## Title
Execute JS code blocks in isolated processes

## Problem
Playbooks containing JS code blocks are parsed but not executed. There is no runner that spawns processes per code block and captures their output for UI display.

## Solution
Use the skills system: add an `execute` skill in the e2e test-project and have the playbook runner invoke that skill (spawned process + IPC). The skill will run JS code blocks in a child Node process and return structured results via IPC to the runner.

## Proposal
- Implement a skill-driven execution flow that matches the skills system contract (the extension injects API / spawns skill processes and communicates via IPC).
- Add the `execute` skill script in `packages/vscode-extension/e2e/test-project/skills/execute.js` (see story `001-add-skill-execute.md`).
- The playbook runner will spawn the skill process and send the `run` message containing the code block. The skill executes the code in a child Node process and replies with a `result` message containing structured output.
- Use `child_process.spawn('node', ['-e', code])` or write a temporary file and run `node <tmpfile>` inside the skill process to execute the code safely (avoid shell-quoting pitfalls).
- For this ticket, follow the chosen safety defaults: do not enforce a per-execution timeout and do not truncate output — the skill and runner should support large responses and long-running executions for now.
- If a code block's language metadata is not `js`/`javascript`, the playbook runner should reject it before invoking the skill.

## Acceptance Criteria
- [ ] Each JS code block executes via the `execute` skill in a child Node process invoked by the skill.
- [ ] Stdout and stderr are fully captured and returned via IPC to the playbook runner.
- [ ] Non-JS code blocks are rejected by the playbook runner before contacting the skill.
- [ ] The system supports large outputs and long-running scripts (no enforced timeout or truncation for now).

## Tasks/Subtasks
- [ ] Ensure `001-add-skill-execute.md` is implemented: add `packages/vscode-extension/e2e/test-project/skills/execute.js` that follows the IPC `run`/`result` contract.
- [ ] Update the playbook runner (extension/server integration) used in e2e tests to spawn the execute skill and relay messages.
- [ ] Add unit tests for success and syntax/runtime error cases. Include tests that validate large-output behavior.
- [ ] Add an example playbook in `packages/vscode-extension/e2e/test-project/` that uses `@execute` with JS code blocks for both successful and failing scenarios.

## Open Questions
- Should executions reuse a warm process for performance, or always spawn new processes? (start with new processes)
- Confirm that "no timeout" and "no truncation" are acceptable for CI and local e2e runs (this permits long-running or very large outputs).

## Additional Info
- For simplicity, avoid advanced sandboxing; focus on correct behavior in tests.

## References
- Epic: Playbook Execution Engine (../epic.md)

---

## Implementation Notes: Required API Changes & Example

### 1. Skill API Changes

To enable a skill to access the parsed markdown blocks and its own index, the injected API must provide:

- `api.blocks`: Array of parsed blocks (from the playbook parser)
- `api.index`: Index of the current skill invocation (the block with the @execute annotation)

This allows the skill to inspect what comes after its annotation (e.g., the next code block) and act accordingly.

**Required code changes:**
- When spawning a skill process, inject the API object with both `blocks` and `index` properties, in addition to any other methods (e.g., sendRequest).
- The runner must parse the markdown, find all annotation blocks, and for each skill invocation, inject the correct index and blocks.

### 2. Example Skill Implementation

```javascript
// Example execute skill: runs the code block after its annotation
module.exports = {
	async run(api, params) {
		// Find the next block after this skill invocation
		const nextBlock = api.blocks[api.index + 1];
		if (!nextBlock || nextBlock.name !== 'plainCodeBlock') {
			return { exitCode: 1, stdout: '', stderr: 'No code block found after @execute' };
		}
		const code = nextBlock.content;
		// ...run code in child process, capture output...
		// For demo, just echo code
		return { exitCode: 0, stdout: code, stderr: '' };
	}
};
```

### 3. Example Runner-Side API Injection

```javascript
// Runner code (simplified)
const blocks = parsePlaybook(mdContent).blocks;
const skillIndex = blocks.findIndex(b => b.name === 'execute');
const api = { blocks, index: skillIndex };
const skill = require('./skills/execute.js');
const result = await skill.run(api, {});
```

---

**Summary:**
- The skill API must inject both the parsed blocks and the current index.
- The skill implementation can then access the next block (code block) and execute it.
- The runner must parse the markdown, inject the correct context, and call the skill's run method with the API.
