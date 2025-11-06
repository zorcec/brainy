# Story: Implement new skills - file-picker and specification

## Context
These skills are needed to improve agent workflow flexibility and user experience in Brainy.
- File-picker enables users to select files for processing, context injection, or automation steps in playbooks.
- Specification skill allows users to input or prefill large markdown/text content, supporting advanced agent scripting and variable/context assignment.
- Both skills support context-driven automation, variable store integration, and playbook execution.
- Dependencies: VS Code API, context management, variable store, playbook engine.

## Goal
- Implement two new skills:
  - file-picker: Allows user to select one or multiple files using VS Code API.
  - specification: Lets user input large text (virtual .md document), passes content to variable or context, supports --content flag for prefill.

## Acceptance Criteria
- file-picker skill enables file selection via VS Code API.
- specification skill allows user to input and save large text, supports --content flag.
- Only one context can be selected at a time; logic for multiple contexts is simplified.

## Implementation Plan
- Develop file-picker skill using VS Code API for file selection.
- Develop specification skill to handle large text input and context/variable assignment.
- Update context selection logic to restrict to one context at a time.

## Edge Cases & Testing
- Test file-picker with single and multiple file selection.
- Test file-picker error handling (user cancels, invalid selection).
- Test specification skill with large text and --content flag.
- Test specification skill with empty, invalid, or very large input.
- Validate context selection logic prevents multiple contexts.

## Risks & Technical Debt
- Risk: Complex context selection logic may cause bugs.
- Risk: UI/UX confusion (dialogs, file selection, large text input).
- Risk: Performance issues with large files or text.
- Mitigation: Simplify and thoroughly test context selection and skill flows. Add clear error handling and user feedback.

## References
- See tasks-collection.md for error details and requirements.
- Related: context selection logic (see 007-execution-bugs), playbook execution engine, variable store module.


## Additional Clarifications & Requirements

### File-picker Skill
- Should support all file/folder selection options provided by VS Code API.
- Returns selected file paths concatenated into a string, split by new line.
- Multi-file selection is required.
- If user cancels the dialog, the skill returns no result (empty output).
- No restrictions on file types/extensions; selection is fully open.
- Immediate selection is sufficient; no preview required.

### Specification Skill
- The --content flag accepts any text, which is prefilled into the virtual document.
- No maximum size limit for input text.
- Accepts any text; no validation for markdown structure.
- Errors (invalid input, save failure) are displayed as tooltips, consistent with validation errors; skill execution fails.
- Variable/context assignment is synchronous only; async workflows are not supported.

### Context Selection Logic
- Only one context can be selected; multiple selection is not possible.
- No scenarios for bypassing context selection (including automation or testing).

### General
- Both skills are accessible only as other skills, from the Brainy markdown file (not via command palette or context menu).
- No specific UI/UX requirements for dialogs, error messages, or confirmations.
- No audit logging or history of skill usage is required for debugging or compliance.

## Outcome
- Two new skills are implemented and tested (unit tests, manual validation).
- Context selection logic is simplified and robust.
- All acceptance criteria and edge cases are covered by tests.
