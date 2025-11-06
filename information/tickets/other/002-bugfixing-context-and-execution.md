# Story: Playbook Execution Context Handling

## Summary
When a playbook is executed, any text block or code block that needs to be executed must be added to the context as an agent type. Code blocks are only added if the preceding block is not an 'execute skill'.

## Motivation
Ensure that playbook execution is consistent and context-aware, supporting agent-based execution for both text and code blocks. Prevent code blocks from being executed redundantly.

## Acceptance Criteria
- [ ] When a playbook runs, text and code blocks are added to the context as agent types.
- [ ] Code blocks are only added if the previous block is not an 'execute skill'.
- [ ] Context is updated correctly for each block type.

## Implementation Notes
## Additional Clarifications
- Only 'text' and 'code' agent types are supported for now, but more types will be added in the future.
- Maintain a constant list of agent types that are automatically added to the context for extensibility.
## Execution History
- No need to track execution history for duplicate context entries at this stage.

## Out of Scope
- UI changes for playbook editor.
- Support for non-standard block types.

## Related Files
- modelClient.ts

---
# Story: Model Client LLM Request Refactor

## Summary
Refactor `modelClient.ts` so it sends requests to the LLM using the VS Code `vscode.lm` API, leveraging the GitHub Copilot subscription.

## Motivation
Current implementation does not send requests to the LLM. Using the official API ensures reliability and proper subscription usage.

## Acceptance Criteria
- [ ] Requests are sent using `vscode.lm` API.
- [ ] Context is passed to the selected model.
- [ ] GitHub Copilot subscription is used for authentication.

## Implementation Notes
## Edge Cases
- No additional authentication or rate limit handling is required; VS Code manages these internally. No limits on our side.

## Out of Scope
- Support for non-Copilot models.
- UI changes for model selection.

## Related Files
- modelClient.ts

---
# Story: Default Model Selection and Playbook Isolation

## Summary
Ensure the default model selected is always `gpt-4.1` when a playbook is started, and that different playbook runs do not conflict with each other.

## Motivation
Prevent model selection conflicts and ensure consistent execution across playbook runs.

## Acceptance Criteria
- [ ] Default model is set to `gpt-4.1` for each playbook run.
- [ ] Playbook runs are isolated and do not affect each other's model selection.

## Implementation Notes
## Model Override
- The default model (`gpt-4.1`) is always enforced; users cannot override per playbook.
## Playbook Isolation & Testing
- Limit execution to one playbook at a time. If a second playbook is started, show an error popup and prevent concurrent runs.

## Out of Scope
- UI for model selection.
- Support for multiple concurrent models per playbook.

## Related Files
- modelClient.ts


# Raw feedback from the user
- when playbook is executed, when textBlock, or code block has to be executed it has to be added into the context, as an agent type. Code block is added only when before it is not execute skill.
- modelClient.ts is not sending requests to LLM. we should use vscode.lm api to send the context to the selected model using the Github copilot subscription
- the default model selected is gpt-4.1, also make sure that one is always used as a default when playbook is started, make sure that different playbook runs are not conflicting.