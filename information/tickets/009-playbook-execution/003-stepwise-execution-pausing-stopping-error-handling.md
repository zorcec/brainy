# Integrate step-wise execution, pausing, stopping, and error handling for playbooks

**Status:** Todo

**Context**
- Play, pause, and stop controls and state machine are planned (see previous stories).
- Need to implement actual step-wise execution of skills in playbooks.
- Pausing should take effect after the current step; stopping should reset state/context.
- Error handling must update state/UI and allow recovery.
- Current code does not execute skills, only parses playbooks.

**Goal**
- Implement step-wise execution of playbook skills.
- Support pausing after current step and resuming.
- Support stopping and resetting state/context.
- Handle errors gracefully, update state/UI, and allow restart.

**Implementation Plan**
- Add logic to execute skills in order, tracking current step.
- On pause, finish current skill, then halt until resumed.
- On stop, reset state/context and UI.
- On error, highlight failed skill, set state to error, and update controls.
- Integrate with state machine and UI feedback from previous stories.

**Edge Cases & Testing**
- Pausing during long-running skill: pause after completion.
- Stopping during execution: all state/context reset, controls update.
- Error in skill: highlight, set error state, allow stop/reset.
- Multiple playbooks: execution is independent.

**Technical Debt & Risks**
- Skill execution may be async/long-running; must handle promises and cancellation.
- Ensure no memory leaks or orphaned state.
- Robust error handling is critical for user experience.

**References**
- `src/skills/index.ts` (skill execution)
- `src/skills/skillProcess.ts` (skill process logic)
- `src/markdown/playButton.ts` (UI integration)
- [Project README](../../../README.md)
- [Project Overview](../../../project-overview.md)
- [Developing Guideline](../../../developing-guideline.md)

**Outcome**
- Playbook skills execute step-by-step with pause/stop support.
- Errors are handled gracefully, with clear UI feedback.
- State/context is reset on stop or error.

---

## Code Examples / Key Changes

- Step-wise execution:
  ```ts
  async function executePlaybookSteps(steps, onStep, onError) {
    for (let i = 0; i < steps.length; i++) {
      if (state === 'paused') break;
      if (state === 'stopped') return reset();
      try {
        await executeSkill(steps[i]);
        onStep(i);
      } catch (e) {
        onError(i, e);
        break;
      }
    }
  }
  ```
- Pause/stop logic:
  - On pause: set state, halt loop after current step.
  - On stop: reset state/context, clear highlights.
- Error handling:
  - Highlight failed skill, set error state, update controls.


  ## Design Decisions & Clarifications

  - Skill execution is strictly sequential; no parallel or conditional execution planned.
  - If a skill is long-running and stop is pressed, wait for it to finish before resetting state/context.
  - Execution cannot be paused in the middle of a skill; pausing only takes effect between steps, so no mid-skill side effects.
  - No user feedback is needed if a skill cannot be paused or stopped immediately (no async pausing).
  - No maximum execution time for skills or playbooks; they run until completion, error, or stop.
  - UI feedback is sufficient for errors; no persistent logging required.
  - No retry for failed skills; restart is always from the beginning.