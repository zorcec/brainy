# Story Template

## Title
Improve Skill Context Handling, Model Autocomplete, and Variable Coloring

## Summary
Fix and enhance skill context retrieval, centralize message handling, improve model autocomplete, speed up slow unit tests, and address variable coloring and definition issues in the task skill.

## Acceptance Criteria
- Skill API returns correct context; context is saved and retrieved as expected
- Function supports names[] parameter to specify which context to return; defaults to selected context if not specified
- Message handling is centralized so all skills automatically add messages to context
- Model autocomplete values are accurate and sourced from VSCode API if possible
- Slow unit tests are optimized for faster execution
- Variable coloring in task skill is correct, including the last quote
- Variables specified without a value are still defined and can be checked for undefined in skills

## Context
Currently, skill API context retrieval is empty and needs fixing. Message handling is duplicated across skills. Model autocomplete values are incorrect. Some unit tests are slow. Variable coloring and definition logic in the task skill are inconsistent.

**Clarifications:**
- The skill names parameter supports multiple names, but the skills API only retrieves one context at a time. Make this distinction clear in documentation and implementation.
- Centralized message handling should be implemented as a utility function inside the VSCode extension logic (no classes).
- Model autocomplete should gracefully fail if VSCode API is unavailable; do not fallback to a static list.
- Profile all unit tests to identify and optimize slow ones.
- For variable coloring, the current logic should work but must consider the last character in the row for proper highlighting.
- Variables defined without a value should default to an empty string, allowing checks for definition (e.g., skill task --debug flag).

## Implementation Notes
- Refactor skill API to ensure context is saved and returned properly
- Add names[] parameter to context retrieval function (support multiple names, but API retrieves one context at a time)
- Move message addition logic to a utility function inside VSCode extension logic (no classes)
- Use VSCode API to fetch available models for autocomplete; gracefully fail if unavailable
- Profile all unit tests and optimize slow ones
- Fix syntax highlighting for variables, ensuring the last character in the row is considered
- Ensure variables are defined even if no value is provided; default to empty string for definition checks

## Test Cases
- Skill API returns correct context for specified names[] and selected context
- Messages are automatically added to context for all skills
- Model autocomplete shows correct values from VSCode API
- Unit tests run faster and pass
- Variable coloring is correct in all cases
- Variables without values are defined and handled as undefined

## Raw feedback for additional context and explanation
- When context is retrieved by the skill api, it is empty. Please make sure context is saved and returned correctly. Add names[] to the function that specifies which context to return, or if not specified, return the currently selected context.
- Every skill returns the messages, so we can automatically add them to the current context, no need to do this manually in each skill. Centralize this logic.
- The autocompleted values of available models are wrong, if possible get them from the vscode API.
- Some unit tests are slow, try to speed them up.
- when variable is specified in the task skill, the last quote " is not colored properly.
- If variable is specified without the value, it should still be defined, so in skill we can check for undefined. Then we do not need to check if string is set to "true" or "1"
