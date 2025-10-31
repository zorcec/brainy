# Unit & Integration Tests for Skills API

## Context
The Brainy skills system exposes a minimal API for VS Code extension authors to interact with LLMs. To ensure reliability and future extensibility, comprehensive unit and integration tests are required for the two public APIs: `selectChatModel` and `sendRequest`. These tests validate correct model selection, request/response flow, error handling, and timeout behavior, forming the foundation for future skill development and agent workflows.

## Goal
Implement and maintain high-coverage unit and integration tests for the skills API, verifying:
- Model selection persistence and retrieval
- Request formation and response normalization
- Error and timeout handling
- End-to-end flows using mocked providers

## Implementation Plan
- Write unit tests for `selectChatModel`:
	- Verify model id is stored and retrieved correctly
	- Assert effect on subsequent `sendRequest` calls
- Write unit tests for `sendRequest`:
	- Validate request formation, role handling, and return shape
	- Test error mapping for provider errors and invalid arguments
- Create integration tests with a mocked model provider:
	- Simulate provider responses and model switching
	- Assert end-to-end behavior and error handling
- Build a test harness simulating skill usage:
	- Call both APIs in sequence and assert flows
	- Include harness as usage example in docs
- Ensure all tests are adjacent to their modules and follow parser/test-adjacent style

## Edge Cases & Testing
- Test for missing or invalid model id
- Simulate provider/network timeouts and assert structured error handling
- Validate error mapping for invalid arguments and provider failures
- Confirm model switching updates context for subsequent requests

## Technical Debt & Risks
- Risk: Incomplete test coverage may allow regressions; mitigate by aiming for high coverage and updating tests with API changes
- Debt: Mock provider may not cover all real-world scenarios; track and expand as needed

## References
- [Skills System Epic](epic.md)
- [Exposing Language Model API to Skills](../../project/preparation/exposing-language-model-api-to-skills.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
All skills API functions are covered by unit and integration tests, with edge cases and error handling validated. Test harness examples are included in docs, and tests act as usage examples for future skill authors.
