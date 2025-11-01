## Title
Add skill "execute" to playbook skills

## Problem
Playbooks reference an `@execute` skill but the repository lacks a canonical skill implementation and example for the e2e test-project. Without it, integration and e2e tests cannot validate execution behavior.

## Solution
Add a minimal `execute` skill that accepts a JS code block string, runs it in a spawned process, and returns stdout/stderr and an exit code.

## Proposal
- Place a simple skill script at `packages/vscode-extension/e2e/test-project/skills/execute.js` (the repo's e2e test-project is under `packages/vscode-extension/e2e/test-project`).
- Important: do NOT change the skills system internals. The skill must follow the existing runtime contract: skills run in a spawned process and receive the extension-provided API via injection or IPC. The skill should not import extension internals.
- Skill invocation contract (recommended, matches existing injection pattern):
	- The extension/playbook runner spawns the skill process (Node) and sends a message via IPC: `process.send({ type: 'run', code, opts })`.
	- The skill listens for the `run` message, executes the provided JS code in a child Node process (or a temporary file + node), and replies via `process.send({ type: 'result', success, exitCode, stdout, stderr })` when finished.
- Execution details:
	- Use `child_process.spawn('node', ['-e', code])` or create a temporary `.js` file and run `node <tmpfile>` to avoid shell-quoting pitfalls.
	- Do not enforce a per-execution timeout
	- Capture stdout and stderr streams and do not truncate (make it in a way it supports large reponses)
	- Return a structured result via IPC: `{ success: boolean, exitCode: number, stdout: string, stderr: string, truncated?: boolean }`.
	- The skill itself should not call the extension `sendRequest`/`selectChatModel` APIs — the execute skill is purely local execution and must remain isolated from LLM calls.


## Acceptance Criteria
- [ ] `execute` skill script exists at `packages/vscode-extension/e2e/test-project/skills/execute.js` and follows the injected-API / IPC contract (skill listens for `run` and replies with `result`).
- [ ] The playbook runner can spawn the skill process, send a `run` message with a JS code string, and receive the structured result.
- [ ] Successful code (e.g., `console.log('hello')`) returns `stdout` containing `hello` and `success: true`.
- [ ] Syntax/runtime errors return `success: false`, a non-zero `exitCode`, and include `stderr` with the error text.
- [ ] Non-JS code blocks are rejected by the playbook runner before sending them to the execute skill.

## Tasks/Subtasks
- [ ] Add `execute` skill script to `packages/vscode-extension/e2e/test-project/skills/execute.js` implementing the IPC contract described above.
- [ ] Ensure the playbook runner used by e2e tests spawns the skill process and sends the `run` message
- [ ] Add unit tests for success, syntax/runtime error, timeout, and large-output truncation cases.
- [ ] Add an example playbook in `packages/vscode-extension/e2e/test-project/` that uses the `@execute` annotation and is referenced by e2e tests.
- [ ] Add e2e test that confirms skill highlighting works

## Open Questions
- Confirm output truncation size for UI hover tooltips (suggested: 4096 bytes).
- Confirm preferred invocation mechanism for the playbook runner in tests: IPC messages (recommended) vs. CLI args or HTTP. I recommend IPC to match the existing injected-API model.

## Additional Info
- Keep the skill intentionally simple to match the epic's scope.

## References
- Epic: Playbook Execution Engine (../epic.md)
