# Story: Register all skills as tools

## Context
<PLACEHOLDER: Add any relevant context about current skill registration and tool usage>

## Goal
- Ensure all skills are registered as tools.
- Each skill controls registration with a flag in its definition.

## Acceptance Criteria
- All skills are registered as tools.
- Skills can opt-in or opt-out using a flag in their definition.

## Implementation Plan
- Audit current skills for registration status.
- Add flag to skill definitions to control tool registration.
- Update registration logic to respect the flag.

## Edge Cases & Testing
- Test registration for skills with and without the flag.
- Validate tool availability for all skills.

## Risks & Technical Debt
- Risk: Skills may be incorrectly registered or missed.
- Mitigation: Add tests and review registration logic.

## References
- See ideas.md for requirements.

## Outcome
- All skills are properly registered as tools, with flag control.
