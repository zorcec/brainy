# Epic: Skill System Expansion

**Status:** Draft

## Context
Add support for custom skills and automation scripts. Build registry and loader for user-defined skills.

## Goal
Enable user-defined skills and automation scripts in the `skills` directory. Registry and loader for skills.

## Scope
- Define skill interface and registration
- Implement skill loader and registry
- Support custom scripts

## Acceptance Criteria
- Skills can be registered and loaded
- Custom scripts supported
- Unit and E2E tests for skill workflows

## Open Questions
- How will skill dependencies be managed?
- What permissions are needed for custom scripts?
- How will skill errors be surfaced to users?

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/server/src/skills/`
- `/packages/vscode-extension/src/skills/`

**Test Coverage:**
- Unit: skill registration, loading
- E2E: skill execution
