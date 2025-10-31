
## Title
Implement Skills System API (refined)

## Context
The skills system requires two minimal APIs (`selectChatModel`, `sendRequest`) for extension authors. These must be pure, composable functions with inline types, following the parser module style and supporting future agent workflows.

## Goal
Implement `selectChatModel(modelId: string)` and `sendRequest(role, content)` in the skills module, with robust error handling and test coverage. Final contract below is the source of truth for implementation and tests.


## Implementation Plan
- Implement `selectChatModel` in `sessionStore.ts` to persist model id as a singleton (no factory needed).
- Implement `sendRequest` in `modelClient.ts` to read the selected model from the singleton session store, forward requests to a provider, normalize responses, and map errors to typed errors defined in `errors.ts`.
- Define typed errors and helper constructors in `errors.ts` (ValidationError, TimeoutError, ProviderError, NetworkError).
- Expose a singleton API object in `index.ts` with `{ selectChatModel, sendRequest }` directly imported and used by consumers and tests.
- Write unit tests for each function and integration tests for API flow using a mocked provider. For test isolation, reset singleton state between tests.
- Test API injection using a lightweight harness (direct import of singleton API) rather than process IPC for unit/integration tests. Document the IPC injection pattern in README as a runtime example.


Important implementation decisions (chosen for consistency):
- Use singleton modules for session store and model client. No factories required; all consumers import and use the same instance.
- `selectChatModel(modelId: string): void` (modelId is a flat string; structured ids can be added later)
- `sendRequest(role: 'user' | 'assistant', content: string, opts?: { timeoutMs?: number }): Promise<{ reply: string; raw: any }>` — `sendRequest` reads the currently selected model from the singleton session store. If no model is selected and no default is provided, it throws `ValidationError`.
- Default timeout: 8000 ms (8s). Make timeout configurable via a module-level variable and per-call via opts.

## Edge Cases & Testing
- Test invalid model id (empty/invalid string) — `selectChatModel` should throw `ValidationError`.
- Test behavior when `sendRequest` is called with no selected model: should throw `ValidationError` unless a default model is provided through the factory (`defaultModelId`).
- Simulate provider/network errors and ensure errors are mapped to `ProviderError`/`NetworkError` with `raw` preserved.
- Simulate timeouts and assert a `TimeoutError` is thrown with `type === 'TimeoutError'`.
- Test malformed provider responses and ensure normalization either returns a reasonable `reply` or throws `ProviderError` containing the raw response.
- Validate correct role handling (only `'user'` and `'assistant'` allowed) and that the returned shape matches `{ reply: string, raw: any }`.

## Technical Debt & Risks
- Risk: If the runtime injection method changes (IPC vs. module import), tests must be updated; mitigate by using factory-based injection for code and tests.
- Debt: The string `modelId` prior imposes a future refactor if more structured model selection is required (vendor/family/options). Track that as a follow-up.

## References
- [Skills System Epic](epic.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
APIs are implemented according to the contract below, with unit and integration tests validating model selection persistence, request/response flow, and error/timeout mapping. The implementation exposes a factory for easy injection and testing.


## Contract (source of truth)
- `selectChatModel(modelId: string): void` — stores the chosen model id in the singleton session store. Throws `ValidationError` for invalid ids.
- `sendRequest(role: 'user' | 'assistant', content: string, opts?: {timeoutMs?: number}): Promise<{ reply: string; raw: any }>` — sends a message to the selected model (or uses a module-level default if configured) and returns normalized reply and raw provider response. Errors are surfaced as typed exceptions.


Example minimal usage (singleton-based)
```ts
import { selectChatModel, sendRequest } from './skills';

selectChatModel('gpt-4o');
const resp = await sendRequest('user', 'Hello');
// resp -> { reply: string, raw: any }
```


## Example: Simulated Skill Harness Test
```typescript
import { selectChatModel, sendRequest } from './skills';

beforeEach(() => {
	// Reset singleton state if needed
});

it('should select model and send request', async () => {
	selectChatModel('gpt-4o');
	const response = await sendRequest('user', 'Hello!');
	expect(response.reply).toBeDefined();
});
```
