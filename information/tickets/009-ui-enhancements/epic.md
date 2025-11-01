# Epic: UI Enhancements for Playbook Execution

**Status:** Draft

## Context
Improve UI for playbook execution: controls, highlighting, agent requests/responses, and context inspection.

## Goal
Add play/pause/stop controls, highlight executing line/block, show agent requests/responses, and context inspection.

## Scope
- Implement play/pause/stop controls
- Highlight current execution
- Display agent requests/responses
- UI for context inspection

## Acceptance Criteria
- UI controls and highlights work
- Agent requests/responses shown
- Unit and E2E tests for UI features

## Open Questions
- What is the best UX for playbook controls?
- How will context inspection be presented?
- How will errors and agent responses be displayed?

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/vscode-extension/src/ui/`

**Test Coverage:**
- Unit: UI logic, state changes
- E2E: user interaction, display
