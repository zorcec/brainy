# Story: Enable built-in tools for every LLM call

## Context
<PLACEHOLDER: Add any relevant context about LLM calls and tool usage>

## Goal
- Ensure every LLM call can use built-in tools by default.

## Acceptance Criteria
- All LLM calls have access to built-in tools unless explicitly disabled.

## Implementation Plan
- Audit current LLM call logic for tool usage.
- Update logic to enable built-in tools by default.
- Add option to disable built-in tools if needed.

## Edge Cases & Testing
- Test LLM calls with and without built-in tools enabled.
- Validate tool usage in various scenarios.

## Risks & Technical Debt
- Risk: Unintended tool usage or conflicts.
- Mitigation: Add tests and review tool integration logic.

## References
- See ideas.md for requirements.

## Outcome
- All LLM calls can use built-in tools by default, with option to disable.
