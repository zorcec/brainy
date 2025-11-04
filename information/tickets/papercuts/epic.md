
# Epic: Papercuts

## Summary
This epic tracks small but impactful improvements and missing safeguards in the Brainy system, including LLM input limit handling, context truncation, and blocking playbook execution on errors, as well as UI/UX polish for skills in the editor.

## Motivation
- Skills color in the editor should be changed to purple.
- On hover, show a short description and usage example, plus all possible options.
- Ensure the VS Code extension cancels ongoing LLM requests if a playbook is stopped (cancellation token support for LLM requests).
- Brainy md validation improvements: eq. `@model "gpt-4.1" e` should result in a validation error.
- Autocomplete for available models, available skills, and their options in the VS Code extension.

## Goals
- Improve editor usability and clarity for skills.
- Provide better discoverability of skill options and usage.

## Non-Goals
<PLACEHOLDER: Specify what is not included in this epic.>

## Success Criteria
<PLACEHOLDER: Define how success will be measured for this epic.>

## Stakeholders
<PLACEHOLDER: List stakeholders involved in this epic.>

## Dependencies
<PLACEHOLDER: List any dependencies for this epic.>

### Related Stories

- [Context manipulation skill: LLM input limits, truncation, playbook error blocking](./context-manipulation-skill-llm-limits.md)
- [VS Code extension: Cancel LLM requests if playbook is stopped](#cancellation-token-llm)
---

### VS Code extension: Cancel LLM requests if playbook is stopped {#cancellation-token-llm}

**Problem:**
Ongoing LLM requests should be cancelled if the user stops a playbook, to avoid wasted compute and improve responsiveness.

**Solution:**
Implement cancellation token support in the VS Code extension. When a playbook is stopped, any in-flight LLM requests should be cancelled immediately.

**Acceptance Criteria:**
- LLM requests are cancelled if playbook is stopped.
- No orphaned or zombie LLM requests remain.
- User receives clear feedback if a request is cancelled.

**References:**
- [VS Code LLM API Reference](https://code.visualstudio.com/api/references/vscode-api#lm)
## Additional Notes
<PLACEHOLDER: Add any extra notes or context.>
