# Story: Context Manipulation Skill - LLM Limits and Playbook Error Blocking

## Summary
Update the context manipulation skill to enforce LLM input limits, support context truncation, and block playbook execution on errors.

## Motivation
- The current skill does not handle LLM input limits or truncation, risking errors and poor user experience.
- Playbook execution should not proceed if there are errors, such as invalid context names.

## Acceptance Criteria
- Enforce a maximum LLM input token limit (e.g., 8,192 tokens for GPT-4, 32,768 for GPT-4-32k, configurable per model, hardcode the limits).
- If the context exceeds the model's input limit, automatically truncate by removing the oldest messages first until under the limit.
- Provide a warning or info message to the user when truncation occurs.
- Block playbook execution if there are any errors in the playbook (e.g., invalid context names, missing required fields), and show clear feedback.
- Validate that context names exist and are unique; block execution if not.
- Validate that all required context fields are present and non-empty.
- Extend e2e tests to cover all scenarious related to the current epic.

**Clarifications:**
- Truncation warning should be shown as an inline message in the editor UI if possible, or as a notification in the bottom right.
- Truncation should only occur when the context actually exceeds the limit, not preemptively.
- All model token limits should be hardcoded and static (research best values for each model).
- If truncation removes all context messages, allow execution with an empty context.
- Validation should fail-fast and show the first error encountered.
- e2e tests should focus on the most common valid and invalid scenarios for each model.

## Out of Scope
- Changes to unrelated skills or playbook features.

## Additional Notes
LLM input token limits to enforce:
	- get current models and their limits, hardcode them
Truncation strategy: Remove oldest messages first (FIFO) until total tokens are within the model's limit.
Warn the user if truncation changes the context.
Block execution on any context or playbook error, including:
	- Invalid or duplicate context names
	- Missing required context fields
	- Any parsing or validation error
See `006-implement-context-manipulation-skill.md` for current limitations and clarifications.
