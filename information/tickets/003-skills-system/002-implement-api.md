
## Title
Implement Skills System API

## Context
The skills system requires two minimal APIs (`selectChatModel`, `sendRequest`) for extension authors. These must be pure, composable functions with inline types, following the parser module style and supporting future agent workflows.

## Goal
Implement `selectChatModel(modelId: string)` and `sendRequest(role, content)` in the skills module, with robust error handling and test coverage.

## Implementation Plan
- Implement `selectChatModel` in `sessionStore.ts` to persist model id
- Implement `sendRequest` in `modelClient.ts` to forward requests and handle responses/errors
- Add error types in `errors.ts`
- Integrate APIs in `index.ts` (no exports; for injection only)
- Write unit tests for each function and integration tests for API flow
- Test API injection using mocks (e.g., mock skill harness or IPC simulation)
- Validate API usage in a simulated skill harness (see example below)

## Edge Cases & Testing
- Test invalid model id, missing selection, and error propagation
- Simulate provider/network errors, malformed requests, and timeouts
- Handle unexpected provider responses and extension context changes
- Validate correct role handling and response normalization

## Technical Debt & Risks
- Risk: Error handling may miss edge cases; mitigate with exhaustive tests
- Debt: API may need refactoring for future features; track in follow-up stories

## References
- [Skills System Epic](epic.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
Both APIs are implemented, tested, and ready for skill integration. All tests pass and error handling is robust. API usage is validated in a simulated skill harness.

## Example: Simulated Skill Harness Test
```typescript
// Simulate skill usage with injected API and mocks
const mockApi = {
	selectChatModel: jest.fn(),
	sendRequest: jest.fn(),
};

it('should inject API and handle skill calls', async () => {
	await mockApi.selectChatModel('gpt-4o');
	const response = await mockApi.sendRequest('user', 'Hello!');
	expect(response.reply).toBeDefined();
});
```
