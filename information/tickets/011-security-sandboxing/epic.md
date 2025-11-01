# Epic: Security & Sandboxing

**Status:** Draft

## Context
Ensure safe execution of scripts and code blocks. Add sandboxing and permission controls for user scripts.

## Goal
Implement sandboxing and permission controls for script execution.

## Scope
- Design sandboxing logic
- Implement permission controls
- Test for security vulnerabilities

## Acceptance Criteria
- Scripts execute safely
- Permissions enforced
- Unit and E2E tests for security

## Open Questions
- What sandboxing technologies are best for Node.js/VS Code?
- How will permission requests be surfaced to users?
- What are the main security risks for user scripts?

## References
- [plan.md](../../plan.md)
- [project-overview.md](../../../project-overview.md)
- [README.md](../../../README.md)
- [developing-guideline.md](../../../developing-guideline.md)

---

**Module Structure Example:**
- `/packages/server/src/security/`
- `/packages/vscode-extension/src/security/`

**Test Coverage:**
- Unit: sandbox logic, permission checks
- E2E: security validation
