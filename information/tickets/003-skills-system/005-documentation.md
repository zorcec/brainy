# Documentation for Skills API

## Context
Clear, concise documentation is essential for extension engineers and future skill authors to understand and use the Brainy skills API. Documentation must cover API signatures, usage examples, error contracts, and test harness flows, following the parser module and project guidelines. This ensures maintainability, onboarding, and correct usage as the system evolves.

## Goal
Provide a comprehensive `README.md` in the skills module folder that:
- Documents public API signatures and types (contract is the source of truth in `002-implement-api.md`)
- Includes usage examples copied from the test harness to ensure they remain accurate
- Explains error handling and contracts and links to `errors.ts`
- Details test run instructions (Vitest) and project style (test-adjacent, factory injection)

## Implementation Plan
- Draft `README.md` in `packages/vscode-extension/src/skills/` with the following sections:
	- Introduction & goals (brief)
	- Contract & API signatures (copy from `002-implement-api.md`)
	- Quick start (factory creation + simple example)
	- Error shapes and how to handle them (reference `errors.ts`)
	- Tests & harness (how to run Vitest in the package and where harness code lives)
	- Notes on injection (example IPC snippet, clearly marked as conceptual)
- Ensure the Quick start example is runnable and matches code from tests/harness

## Edge Cases & Testing
- Ensure documentation is up to date with API changes
- Validate examples match actual test cases and harness flows
- Check for missing or unclear error contract explanations
- Confirm README is discoverable and referenced in related docs

## Technical Debt & Risks
- Risk: Documentation may lag behind code changes; mitigate by updating README with every API/test change
- Debt: Initial examples may not cover all edge cases; track and expand as APIs evolve

## References
- [Skills System Epic](epic.md)
- [Unit & Integration Tests Story](004-unit-integration-tests.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
README in the skills module folder fully documents the API, usage, error handling, and test flows. Documentation is clear, up to date, and referenced by related project docs, enabling easy onboarding and correct usage.
