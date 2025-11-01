# Epic: Context Management & Chaining

**Status:** Draft

## Context
Enable context isolation, chaining, and injection for advanced agent workflows.

## Goal
Support context switching, combining, and chaining for playbooks and agent workflows.

## Scope
- Design context isolation and chaining logic
- Implement context injection and switching
- UI for context inspection

## Acceptance Criteria
- Context can be isolated, chained, and injected
- UI shows current context
- Unit and E2E tests for context workflows

## Open Questions
- What is the best way to visualize context changes in the UI?
- How will context be persisted and restored between sessions?
- What edge cases exist for context switching?

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/server/src/context/`
- `/packages/vscode-extension/src/context/`

**Test Coverage:**
- Unit: context logic, edge cases
- E2E: context switching, inspection
