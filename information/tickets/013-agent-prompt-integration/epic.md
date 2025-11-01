# Epic: Agent Prompt/LLM Integration

**Status:** Draft

## Context
<PLACEHOLDER: Describe the need for integrating agent prompt/LLM responses into Brainy workflows.>

## Goal
<PLACEHOLDER: State the main objective for agent prompt/LLM integration.>

## Scope
- Define playbook step type for agent prompt/LLM interaction
- Implement prompt handling logic (send prompt, receive response)
- Inject/display LLM responses in playbook execution
- Handle errors and security for agent prompt steps

## Acceptance Criteria
- Agent prompt steps execute and display LLM responses
- Responses can be used in subsequent playbook steps
- Unit and E2E tests for agent prompt integration

## Open Questions
- What LLMs/agents will be supported?
- How will prompt/response chaining work?
- What security measures are needed for prompt handling?

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/server/src/agent-prompt/`
- `/packages/vscode-extension/src/agent-prompt/`

**Test Coverage:**
- Unit: prompt handling, error cases
- E2E: agent prompt runs, output display
