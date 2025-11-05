# Add skill execution state machine and UI feedback (highlighting, enable/disable controls)

**Status:** Todo

**Context**
- No execution state machine exists; only parsing is supported now.
- Need to track playbook execution state: idle, running, paused, stopped, error.
- UI feedback (highlighting, control enable/disable) must reflect current state and step.
- Current highlighting is only for parser errors (red, via decorations/semantic tokens).

**Goal**
- Implement a state machine to manage playbook execution state per editor.
- Highlight the currently executing skill in yellow; failed skill in red.
- Enable/disable controls based on state and errors.
- Ensure UI updates immediately on state changes.

**Implementation Plan**
- Add a state machine (idle, running, paused, stopped, error) to track execution per playbook/editor.
- Update CodeLens and decorations based on state.
- Highlight current skill (yellow) and failed skill (red) using editor decorations.
- Integrate state changes with command handlers (play, pause, stop).
- Ensure state is reset on stop or error.

**Edge Cases & Testing**
- Skill fails: state transitions to error, highlight in red, controls update.
- Paused: highlight remains on current skill until resumed.
- Stopped: all highlights and state reset.
- Multiple playbooks: state and highlights are independent.

**Technical Debt & Risks**
- Per-editor state management can be complex.
- Highlighting must not conflict with error decorations.
- Ensure state transitions are robust and race conditions are avoided.

**Design Decisions & Clarifications**
- State machine and highlights are reset only on stop or error, not on manual edits.
- If a skill fails, user must restart from the beginning (no resume from failed step).
- State changes (play/pause/stop) are processed sequentially; disabled buttons prevent overlap.
- Multiple editors for the same playbook: state/highlights can be independent or shared, whichever is easier or already implemented.
- Closing the editor always resets state to idle (stops execution).
- Highlight colors should follow best practices and use theme colors if possible (not hardcoded yellow/red).

**References**
- `src/markdown/playButton.ts` (CodeLens, error highlighting)
- `src/markdown/annotationHighlightProvider.ts` (decorations)
- [VS Code Decoration API](https://code.visualstudio.com/api/references/vscode-api#TextEditorDecorationType)
- [Project README](../../../README.md)
- [Project Overview](../../../project-overview.md)
- [Developing Guideline](../../../developing-guideline.md)

**Outcome**
- Playbook execution state is tracked and reflected in the UI.
- Current skill is highlighted in yellow; failed skill in red.
- Controls are enabled/disabled based on state and errors.

---

## Code Examples / Key Changes

- State machine:
  ```ts
  type ExecutionState = 'idle' | 'running' | 'paused' | 'stopped' | 'error';
  // Per-editor state map
  const editorStates = new Map<string, ExecutionState>();
  ```
- Highlighting:
  ```ts
  // Use editor.setDecorations for yellow (current) and red (failed) lines
  editor.setDecorations(currentSkillDecoration, [range]);
  editor.setDecorations(failedSkillDecoration, [range]);
  ```
- Update CodeLens enable/disable logic based on state.
- Reset highlights and state on stop or error.
