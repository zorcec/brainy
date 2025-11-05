
# Epic: Papercuts

## Summary
This epic tracks small but impactful improvements and missing safeguards in the Brainy system, including LLM input limit handling, context truncation, and blocking playbook execution on errors, as well as UI/UX polish for skills in the editor.

## Motivation
This epic requires the following tasks to be implemented or adjusted:
- Change skills color in the editor to purple for better visual distinction.
- On hover, display a short description, usage example, and all possible options for each skill.
- Implement cancellation token support in the VS Code extension so ongoing LLM requests are cancelled if a playbook is stopped.
- Improve Brainy markdown validation: invalid syntax such as `@model "gpt-4.1" e` must result in a clear validation error.
- Add autocomplete for available models, skills, and their options in the VS Code extension.
- After skill execution, allow users to inspect the returned object on hover in the editor (for debugging and pausing execution).
- When playback is stopped, attempt to terminate the current skill execution if possible.
- When a skill is exported, support an `expose` flag that registers it as a VS Code tool.

- Provide better discoverability of skill options and usage.

## Non-Goals
This epic does not cover major architectural changes, new skill types, or non-editor UI features. It excludes backend LLM model improvements unrelated to context handling, and does not address large-scale refactoring or unrelated bug fixes.

## Success Criteria
All listed improvements are implemented and verified. Editor shows purple skills, hover displays descriptions and options, and LLM requests are cancelled on playbook stop. Autocomplete and validation work as described. User feedback confirms improved usability and discoverability.

## Stakeholders
Product Owner, VS Code extension developers, QA engineers, end users (developers using Brainy), and documentation writers.

## Dependencies
Depends on the current VS Code extension architecture, LLM API integration, and skill system implementation. May require updates to the validation and autocomplete subsystems.

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
Coordinate with the UI/UX team for color and hover changes. Ensure robust error handling for LLM request cancellation. Document all new features and changes for users.
