# Epic: Playbook Execution Engine

**Status:** Draft

## Context
Move Brainy from parsing and logging to actual execution of playbook steps. Enable code block execution and agent prompt handling.

## Goal
Enable users to use the @execute skill inside .md files. When a JS code block is provided, it is executed in a spawned process, and the output or errors are displayed as a hover tooltip in the editor UI. Non-JS code blocks halt execution and show an error. Failed executions stop the playbook and visually indicate the error. No agent prompt/LLM response injection mechanism for now. The implementation should prioritize simplicity over security or advanced process isolation.

## Clarified Requirements & Answers

### Agent Prompt Handling
- No agent prompt/LLM response injection mechanism for now.

### Error Handling
- Failed executions halt the playbook and visually indicate the error in the editor UI (hover display).

### UI Output
- Output and errors are shown via hover tooltips only (no panel/inline for now).

### Process Isolation
- Use the simplest implementation (per code block or shared process); security/sandboxing is not a priority.

### Non-JS Code Blocks
- Non-JS code blocks should halt execution and display an error.

### Testing: Edge Cases & Failure Modes
- Edge cases to cover:
	- Infinite loops in JS code blocks
	- Large output handling
	- Process crashes or unexpected exits
	- Syntax errors in JS code
	- Non-JS code block error handling
	- Output display failures (hover not rendering)
	- Multiple sequential executions
	- Skill invocation errors

### Skill "execute" Interface
- The `execute` skill is a JS script added to the e2e/test-project.
- It must work end-to-end (invoked from playbook, executed, output/error shown).

### Integration Points
- Skills are executed via Brainy, with API injected.
- Refer to the existing code in the `skill` folder for integration details.
## Scope
Parse playbook steps and code blocks
Execute each code block in its own process
Support only JS code blocks; other languages result in an error
Capture and display output
Parse playbook steps and code blocks
Execute each code block in its own process
Support only JS code blocks; other languages result in an error
Capture and display output in the UI (panel, inline, or hover tooltip)
- Playbook steps execute with output shown
- Agent prompt handling integrated
Each JS code block executes in a separate process with output shown
Non-JS code blocks result in a clear error message
Agent prompt handling integrated
Unit and E2E tests for execution, including error cases
Output is visible in the UI, including as a hover tooltip on playbook steps
- What error handling is needed for failed executions?
- How will agent prompt/LLM responses be injected into playbooks?

## Stories proposal
- Add skill "execute"
- Execute JS Code Blocks in Isolated Processes
- Detailed Unit and E2E Tests

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/server/src/playbook/`
- `/packages/vscode-extension/src/playbook/`

**Test Coverage:**
- Unit: executor logic, error cases
- E2E: playbook runs, output display
