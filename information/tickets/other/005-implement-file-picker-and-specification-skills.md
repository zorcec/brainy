# Story: Implement file-picker and specification skills

**Status:** Todo

**Context:**
- Need to add two new skills:
  - file-picker: Allows user to select one or multiple files using VS Code API.
  - specification: Lets user input large text, acting as a virtual .md document. Content is passed to a variable or added to context. Supports a `--content` flag for prefilled content.

**Goal:**
- Implement file-picker skill using VS Code API for file selection.
- Implement specification skill for large text input and context/variable assignment.
- Ensure both skills are integrated and tested.

**Implementation Plan:**
- Design and code file-picker skill with multi-file support.
- Design and code specification skill with input, variable/context assignment, and `--content` flag.
- Add documentation and usage examples.
- Test both skills in various scenarios.

**Edge Cases & Testing:**
- Test file-picker with single and multiple file selection.
- Test specification skill with/without prefilled content and variable assignment.
- Validate error handling and user feedback.

**Technical Debt & Risks:**
- Risk: API changes may affect skill reliability.
- Mitigation: Add robust error handling and update documentation as needed.

**References:**
- See requirements in `tasks-collection.md`.

**Outcome:**
- Both skills are implemented, documented, and work as expected.

**Questions:**
Should the file-picker skill support folder selection, or only files?
Both files and folders should be supported.
For the specification skill, are there limits on document size or formatting requirements?
No limits on document size or formatting requirements.
Is integration with other skills or workflows required for these new skills?
No special integration required; code is executed and result is returned like every other skill.
Should usage examples include error scenarios and recovery steps?
No need to include error scenarios or recovery steps in usage examples.
Are there specific UI/UX requirements for how users interact with these skills?
For specification skill, use the standard virtual md editor.
Do you want to link this story to related tickets for traceability?
No.

---

# Code Examples

## File-picker Skill Example
```typescript
// Usage: Select one or multiple files or folders
const selected = await vscode.window.showOpenDialog({
  canSelectFiles: true,
  canSelectFolders: true,
  canSelectMany: true,
  openLabel: 'Select files or folders'
});
if (selected) {
  // Handle selected files/folders
  return selected.map(uri => uri.fsPath);
}
```

## Specification Skill Example
```typescript
// Usage: Open virtual markdown editor and get content
const content = await openVirtualMdEditor({
  prefill: options.content || '',
  onClose: (text) => {
    if (options.variable) {
      context[options.variable] = text;
    } else {
      context.add(text);
    }
  }
});
```