# Epic: Playbook Execution Engine

**Status:** Draft

## Context
Move Brainy from parsing and logging to actual execution of playbook steps. Enable code block execution and agent prompt handling.

## Goal
Implement playbook step execution for Bash, Python, JS code blocks. Capture output and integrate agent prompt handling.

## Scope
- Parse playbook steps and code blocks
- Execute code blocks securely
- Capture and display output
- Integrate agent prompt/LLM responses

## Acceptance Criteria
- Playbook steps execute with output shown
- Agent prompt handling integrated
- Unit and E2E tests for execution

## Open Questions
- How will code block execution be sandboxed for security?
- What error handling is needed for failed executions?
- How will agent prompt/LLM responses be injected into playbooks?

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
