# Story: Implement new skills - file-picker and specification

## Context
<PLACEHOLDER: Add any relevant context about why these skills are needed, related features, or dependencies>

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
- Test specification skill with large text and --content flag.
- Validate context selection logic prevents multiple contexts.

## Risks & Technical Debt
- Risk: Complex context selection logic may cause bugs.
- Mitigation: Simplify and thoroughly test context selection.

## References
- See tasks-collection.md for error details and requirements.

## Outcome
- Two new skills are implemented and tested.
- Context selection logic is simplified and robust.
