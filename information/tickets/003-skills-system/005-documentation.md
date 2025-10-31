# Documentation for Skills API

## Context
Clear, concise documentation is essential for extension engineers and future skill authors to understand and use the Brainy skills API. Documentation must cover API signatures, usage examples, error contracts, and test harness flows, following the parser module and project guidelines. This ensures maintainability, onboarding, and correct usage as the system evolves.

## Goal
Provide a comprehensive README in the skills module folder that:
- Documents public API signatures and types
- Includes usage examples from tests and harness
- Explains error handling and contracts
- Details test run instructions and project style

## Implementation Plan
- Draft README.md in `packages/vscode-extension/src/skills/`
- Document API signatures for `selectChatModel` and `sendRequest`
- Add example flows from unit/integration tests and harness
- Describe error contracts and handling strategies
- Include instructions for running and extending tests
- Reference parser module and developing guideline for style

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
