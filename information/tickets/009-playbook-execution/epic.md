# Playbook Execution Controls and UI

**Status:** Todo

**Context**
- Brainy enables deterministic agent workflows in markdown with skills and context control.
- Current extension provides play button (parse only), error highlighting, and skill scanning.
- No support yet for full playbook execution controls (play, pause, stop), step highlighting, or session state management in the editor.
- User wants interactive controls and visual feedback for playbook execution in the VS Code markdown editor.

**Goal**
- Implement play, pause, and stop controls for playbook execution in the editor UI.
- Highlight the currently executing skill in yellow; highlight failed skill in red.
- Enable/disable buttons based on execution state:
  - Play: enabled only if no errors in playbook and not already running.
  - Pause/Stop: enabled only during an active session.
- When paused, execution pauses after the current step; play or pause resumes.
- Stop resets state/context; play restarts from beginning.

**Implementation Plan**
- Add play, pause, and stop buttons to the editor (CodeLens or Webview UI).
- Track playbook execution state (idle, running, paused, stopped, error).
- Highlight current skill (yellow) and failed skill (red) using editor decorations or semantic tokens.
- Disable/enable controls based on state and playbook errors.
- Implement step-wise execution and pausing logic.
- On stop, clear context and reset UI.
- Integrate with skill execution and error handling.

**Edge Cases & Testing**
- Playbook with errors: play button disabled, error highlighted.
- Pause during skill: execution pauses after step, can resume.
- Stop during execution: resets state, disables pause/stop, enables play.
- Skill fails: highlight in red, allow stop/reset.
- Multiple playbooks open: state managed per editor.

**Technical Debt & Risks**
- UI complexity: CodeLens is limited; may require Webview for advanced controls. (but we want to avoid it, use only what is available in CodeLens/decorations/commands)
- State management: ensure session state is isolated per playbook/editor.
- Skill execution errors: must not crash extension; handle gracefully.
- Testing: need robust tests for UI and execution state transitions.

**References**
- [Project Overview](../../project/overview.md)
- [Annotations Workflow Example](../../project/preparation/annotations-workflow.md)
- [Current Extension Code](../../../packages/vscode-extension/src/)
- [VS Code API: CodeLens, Decorations, Commands]

**Outcome**

---

## Proposed Stories

- Implement play, pause, and stop controls with CodeLens and command logic
- Add skill execution state machine and UI feedback (highlighting, enable/disable controls)
- Integrate step-wise execution, pausing, stopping, and error handling for playbooks
- Test UI, state transitions, and edge cases for robust user experience
