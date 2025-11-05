# Implement play, pause, and stop controls with CodeLens and command logic

**Status:** Todo

**Context**
- Current extension provides a play button (parse only) via CodeLens in `playButton.ts`.
- No pause or stop controls exist; only parsing is triggered, not execution.
- CodeLens is used for UI controls, and commands are registered in `registerPlaybookCommands`.
- Need to extend UI to support pause and stop, and wire up new commands.

**Goal**
- Add pause and stop buttons alongside play in the editor for `.brainy.md` files.
- Register new commands for pause and stop.
- Ensure only one set of controls is visible per playbook/editor.
- Play: starts execution if no errors and not already running.
- Pause: pauses after current step.
- Stop: stops and resets state/context.

**Implementation Plan**
- Update `PlaybookCodeLensProvider` to provide multiple CodeLens controls (play, pause, stop).
- Register new commands in `registerPlaybookCommands`.
- Track execution state (idle, running, paused, stopped) per editor.
- Enable/disable controls based on state and playbook errors.
- Integrate with playbook execution logic (to be implemented in later stories).
- All main use-cases are covered by e2e tests.

**Design Decisions & Clarifications**
- Pause and stop CodeLens should always be visible, but disabled when not applicable.
- Closing an editor is equivalent to stopping execution for that session.
- Splitting the editor can be a separate session or reuse the existing one (choose the simpler approach).
- Disabled controls should follow VS Code UI conventions (e.g., grayed out, tooltip if standard).
- No need to debounce/throttle CodeLens refreshes; keep logic simple.
- No accessibility or keyboard navigation requirements beyond defaults.
- No keyboard shortcuts or explicit state transition logging needed.

**Edge Cases & Testing**
- Only one playbook can be running per editor.
- Controls update correctly on state change.
- Play disabled if errors exist; pause/stop only enabled when running.
- Multiple playbooks open: controls are independent.

**Technical Debt & Risks**
- CodeLens UI is limited; may need to update on state changes.
- State management per editor can be tricky.
- Ensure commands are disposed/cleaned up.

**References**
- `src/markdown/playButton.ts` (CodeLens logic)
- `src/extension.ts` (command registration)
- [VS Code CodeLens API](https://code.visualstudio.com/api/references/vscode-api#CodeLensProvider)
- [Project README](../../../README.md)
- [Project Overview](../../../project-overview.md)
- [Developing Guideline](../../../developing-guideline.md)

**Outcome**
- Play, pause, and stop controls are visible in the editor for `.brainy.md` files.
- Controls are enabled/disabled based on state and errors.
- Commands are registered and ready for execution logic.

---

## Code Examples / Key Changes

- `PlaybookCodeLensProvider.provideCodeLenses`:
  - Add multiple CodeLens (play, pause, stop) with correct enable/disable logic.
- `registerPlaybookCommands`:
  - Register `brainy.playbook.pause` and `brainy.playbook.stop` commands.
- State tracking:
  - Add per-editor state (idle, running, paused, stopped) to control UI.
- Example:
  ```ts
  // In provideCodeLenses
  const playEnabled = !hasErrors && state === 'idle';
  const pauseEnabled = state === 'running';
  const stopEnabled = state === 'running' || state === 'paused';
  // ...
  ```
- Update command handlers to update state and refresh CodeLens.
