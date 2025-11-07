# Story: Implement new skills - file-picker and specification

## Context
These skills are needed to improve agent workflow flexibility and user experience in Brainy.
- File-picker enables users to select files for processing, context injection, or automation steps in playbooks.
- Document skill allows users to input or prefill large markdown/text content, and support variable/context assignment.
- Both skills support context-driven automation, variable store integration, and playbook execution.
- Dependencies: VS Code API, context management, variable store, playbook engine.

## Goal
- Implement two new skills:
  - file-picker: Allows user to select one or multiple files using VS Code API.
  - document: Lets user input large text (virtual .md document), passes content to variable or context, supports --content flag for prefill.

## Acceptance Criteria
- file-picker skill enables file selection via VS Code API.
- document skill allows user to input and save large text, supports --content flag.
- Only one context can be selected at a time; logic for multiple contexts is simplified.

## Implementation Plan
- Develop file-picker skill using VS Code API for file selection.
- Develop document skill to handle large text input and context/variable assignment.
- Update context selection logic to restrict to one context at a time.

## Edge Cases & Testing
- Test file-picker with single and multiple file selection.
- Test file-picker error handling (user cancels, invalid selection).
- Test document skill with large text and --content flag.
- Test document skill with empty, invalid, or very large input.
- Validate context selection logic prevents multiple contexts.

## References
- Related: context selection logic (see 007-execution-bugs), playbook execution engine, variable store module.


## Additional Clarifications & Requirements

## Challenge Clarifications

- File-picker skill supports both file and folder selection. Directory output will be formatted as `./some-directory (directory)`.
- If both files and folders are selected, the output/variable value will be:

  Files selected
  - ./test/bla.md
  - ./test2/bla.md
  - ./some-directory (directory)

- For the document skill, there is no prompt or handling for unsaved changes; content is picked up as soon as the document is closed.
- Document skill does not support additional flags (file type, encoding, read-only, etc.).
- No accessibility or localization requirements for dialogs or error messages.
- No maximum number of files/folders for file-picker selection.
- No customization or override of default success/failure messages for either skill.

### File-picker Skill
- Should support all file/folder selection options provided by VS Code API.
- Returns all selected file and folder paths, concatenated into a string (one per line), and puts this value in the specified variable (if --variable is set).
- Example output in variable:
```
  Files selected
  - ./test/bla.md
  - ./test2/bla.md
  - ./some-directory (directory)
```
- Multi-file selection is required.
- If user cancels the dialog, the skill returns no result (empty output).
- No restrictions on file types/extensions; selection is fully open.
- Immediate selection is sufficient; no preview required.

### Document Skill
- Skill supports both --variable and --content flags.
- When invoked, a virtual .md document is opened and prefilled with the value from --content (if provided).
- Once the document is closed, the content is captured via the `onDidCloseTextDocument` event.
  - The captured content is stored in the context as a user message.
  - If --variable is set, the content is also stored in the specified variable.
- When the document is closed, the user is **not** prompted to save changes (no save dialog).
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
---

## Implementation Analysis & Code Change Plan

### Existing Code Review

- **file-picker.ts**: Supports file/folder selection and variable assignment, but does not currently distinguish directories in output or format as required.
- **specification.ts**: Opens a markdown document and stores content, but uses a modal dialog for completion instead of `onDidCloseTextDocument`.
- **skillApi.ts**: Provides helpers for file dialog and document editing, but `openTextDocument` uses modal dialog, not event-driven capture.

### Required Changes & Examples

#### 1. `file-picker.ts`
**Change:** When building output, check if each selected URI is a directory and append ` (directory)` if so. Format output as:
```
Files selected
- ./test/bla.md
- ./test2/bla.md
- ./some-directory (directory)
```
**Why:** To match clarified requirements for output and variable value.

**Example:**
```typescript
const paths = selectedUris.map(uri => {
  const isDir = fs.lstatSync(uri.fsPath).isDirectory();
  return `- ${uri.fsPath}${isDir ? ' (directory)' : ''}`;
});
const output = `Files selected\n${paths.join('\n')}`;
api.setVariable(variable, output);
```

#### 2. `specification.ts`
**Change:** Remove modal dialog for completion; instead, listen for `onDidCloseTextDocument` to capture content. When the document is closed, immediately capture its content and store in context/variable.
**Why:** To match clarified requirements for event-driven, non-blocking, and no-save-prompt behavior.

**Example:**
```typescript
// In execute:
const doc = await api.openTextDocument(content, 'markdown');
const disposable = vscode.workspace.onDidCloseTextDocument(closedDoc => {
  if (closedDoc === doc) {
    const finalContent = closedDoc.getText();
    // Store in context/variable as required
    disposable.dispose();
  }
});
```

#### 3. `skillApi.ts`
**Change:** Update `openTextDocument` to not use modal dialog, and to support event-driven content capture.
**Why:** To support the new document skill behavior.

---

### Files to Change

- `packages/vscode-extension/src/skills/built-in/file-picker.ts`: Update output formatting and directory detection.
- `packages/vscode-extension/src/skills/built-in/specification.ts`: Switch to event-driven content capture on document close.
- `packages/vscode-extension/src/skills/skillApi.ts`: Update or add helper for event-driven document editing.

These changes will ensure the skills match the clarified requirements for output, event handling, and user experience.
