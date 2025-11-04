## Title
Implement Tool-Calling Support in Task Skill

## Problem
The current `task` skill does not support tool-calling, which is required for advanced LLM workflows (e.g., function calling, code execution, or invoking other skills/tools from the LLM). Exposing tool-calling options will enable richer automation and agent capabilities.

## Solution
Implement tool-calling support in the `task` skill by allowing users to specify `tools` and `toolMode` (from `LanguageModelChatRequestOptions`). The skill should pass these options to the LLM API, enabling the LLM to call registered tools as part of its response generation.

## Acceptance Criteria
- All tests are passing.
- The task skill supports `tools` and `toolMode` parameters.
- The skill passes these options to the LLM API.
- Tool-calling is documented and tested.
- Usage examples are provided.

## Tasks/Subtasks
- [ ] Extend the task skill interface to accept `tools` and `toolMode`.
- [ ] Update implementation to pass these to the LLM API.
- [ ] Add unit tests for tool-calling scenarios.
- [ ] Document tool-calling usage and provide examples.

## Open Questions
- How should tool results be returned to the playbook?
- Should tool-calling be restricted to certain models or roles?
- How should errors in tool execution be surfaced?

## Additional Info & References
- See [VS Code LLM API Reference](https://code.visualstudio.com/api/references/vscode-api#lm)
- See [Task Skill Story](../007-implement-task-skill.md)

## Proposal
- Extend the `TaskSkillParams` interface to include `tools` and `toolMode`.
- Update the `execute` function to pass these options to `api.sendRequest`.
- Add tests and documentation for tool-calling scenarios.

---

*This story is inspired by the task skill implementation and focuses specifically on tool-calling support as described in the VS Code LLM API.*
