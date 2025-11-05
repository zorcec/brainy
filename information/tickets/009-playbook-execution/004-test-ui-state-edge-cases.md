# Test UI, state transitions, and edge cases for robust user experience

**Status:** Todo

**Context**
- Play, pause, stop controls, state machine, and step-wise execution are planned/implemented in previous stories.
- Need to ensure robust user experience through comprehensive testing.
- Focus on parsing and error highlighting only. But you're encouraged to think about additional test-cases beyond main flows.

**Goal**
- Test all UI controls, state transitions, and edge cases for playbook execution.
- Ensure controls are enabled/disabled correctly in all scenarios.
- Validate highlighting and state reset on stop/error.
- Test multiple playbooks/editors independently.

**Implementation Plan**
- Write unit and unit and e2e tests for:
  - Play, pause, stop controls (enabled/disabled logic)
  - State transitions (idle, running, paused, stopped, error)
  - Highlighting of current/failed skills
  - Step-wise execution, pausing, stopping, error handling
  - Multiple playbooks/editors
- Use mocks or test skills to simulate execution and errors.
- Validate UI updates and state cleanup.

**Edge Cases & Testing**
- Playbook with errors: play disabled, error highlighted.
- Pause/stop during execution: state and UI update correctly.
- Skill fails: error state, highlight, controls update.
- Multiple playbooks: independent state/UI.

**Technical Debt & Risks**
- UI testing in VS Code can be complex; may require e2e tests.
- Ensure tests are reliable and not flaky.
- Maintainability of test code as features evolve.

**References**
- `src/markdown/playButton.ts` (UI logic)
- `src/skills/index.ts` (skill execution)
- `src/markdown/annotationHighlightProvider.ts` (highlighting)
- Existing test files in `src/`
- [Project README](../../../README.md)
- [Project Overview](../../../project-overview.md)
- [Developing Guideline](../../../developing-guideline.md)

**Outcome**
- All controls, state transitions, and edge cases are tested.
- UI and state are robust and reliable for users.

---

## Code Examples / Key Changes

- Example test (pseudo):
  ```ts
  it('disables play when errors exist', () => {
    // Simulate parse error
    // Assert play CodeLens is disabled
  });
  it('highlights current skill during execution', () => {
    // Simulate running state
    // Assert yellow highlight on current skill
  });
  it('resets state and highlights on stop', () => {
    // Simulate stop
    // Assert state/context reset, highlights cleared
  });
  ```
- Add/extend tests in `src/markdown/playButton.test.ts`, `src/skills/index.test.ts`.
