# Epic: Advanced E2E & Integration Testing

**Status:** Draft

## Context
Expand E2E coverage to include execution, context management, and skill workflows. Add integration tests for agent and Copilot handoff.

## Goal
Comprehensive E2E and integration tests for new features and workflows.

## Scope
- Write E2E tests for playbook execution, context, skills
- Add integration tests for agent/Copilot handoff
- Validate test coverage

## Acceptance Criteria
- E2E and integration tests cover all new features
- Test results documented

## Open Questions
- What are the most critical E2E scenarios?
- How will test failures be surfaced and tracked?
- What tools and frameworks are best for integration testing?

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/vscode-extension/e2e/`

**Test Coverage:**
- E2E: playbook, context, skills
- Integration: agent/Copilot handoff
