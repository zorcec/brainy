# Epic: Copilot Integration

**Status:** Draft

## Context
Enable `@gh-copilot-context` sharing and context handoff to GitHub Copilot. Build `/brainy.get-context {id}` tool for agent interoperability.

## Goal
Integrate Copilot context sharing and handoff tools for seamless agent workflows.

## Scope
- Implement context sharing logic
- Build `/brainy.get-context {id}` tool
- Test agent interoperability

## Acceptance Criteria
- Copilot context sharing works
- Handoff tool functions
- Unit and E2E tests for integration

## Open Questions
- What data formats are required for context handoff?
- How will context updates be synchronized?
- What security/privacy concerns exist?

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/vscode-extension/src/copilot/`
- `/packages/server/src/copilot/`

**Test Coverage:**
- Unit: context sharing, handoff
- E2E: agent interoperability
