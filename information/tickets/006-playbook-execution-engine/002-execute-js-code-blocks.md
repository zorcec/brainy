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
