# Story: Dynamic Context Limit via VS Code LM API

## Context

Change context limit to use the VS Code lm API at runtime to obtain maxInputTokens and to call countTokens (this will require async changes across truncation and getContext paths and test updates).

Root cause:
The executor does not aggregate and inject the current context into the skill parameters for annotation blocks (especially LLM calls). Context is only updated internally, not serialized or forwarded, so the LLM receives an empty context.

- The context should automatically be handled on the extension side, we need to fix this.
- Additionally, in the task skill we retrieve the context, which is empty, this has to be checked.

## Acceptance Criteria

- The context limit is dynamically retrieved using the VS Code lm API at runtime.
- The system uses `maxInputTokens` and `countTokens` for context management.
- All truncation and context aggregation logic is updated to support async API calls.
- The executor correctly injects the current context into skill parameters for annotation blocks (especially LLM calls).
- The context is properly serialized and forwarded to LLMs.
- Task skill retrieves and uses the correct context.
- Automated tests cover context limit changes and context injection.

## Implementation Plan

1. Refactor context limit logic to use VS Code lm API for `maxInputTokens` and `countTokens`.
2. Update truncation and getContext paths to support async API calls.
3. Modify executor to aggregate and inject current context into skill parameters for annotation blocks.
4. Ensure context is serialized and forwarded to LLMs.
5. Fix context handling on the extension side.
6. Update task skill to retrieve and use the correct context.
7. Write and update tests for new context limit and injection logic.

## Risks & Dependencies

- Async changes may introduce race conditions or timing issues.
- Refactoring may affect existing context aggregation and injection logic.
- Dependency on VS Code lm API availability and stability.
- Potential impact on performance due to dynamic context calculation.

## Additional Notes

Reference: VS Code lm API documentation for `maxInputTokens` and `countTokens`.
Ensure backward compatibility with previous context handling logic.
Coordinate with extension and server teams for integration.

---
**Challenge Q&A:**
- Is the async refactor for context limit and injection feasible with current architecture?
	- Yes, should be. Implement it and feel free to adjust the current code if that would simplify it.
- Are there any edge cases or legacy integrations that might break?
	- If they break, fix them.
- Is the VS Code lm API stable and available for all target environments?
	- Should be.
- Do you need more details on test coverage or integration steps?
	- No, just make them all pass at the end.
