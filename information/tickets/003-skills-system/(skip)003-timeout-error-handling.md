
## Title
Error Handling and Timeout Logic for Skills

## Context
Skills must receive clear, structured feedback for all failures, including timeouts, network issues, and provider errors. Reliable error handling is essential for safe skill development and debugging.

## Goal
Ensure all errors and timeouts in skill API calls are surfaced as structured exceptions, with consistent contracts and robust test coverage. Use an 8000ms default timeout (configurable) and export typed error constructors for tests and callers.

## Implementation Plan
- Implement timeout logic for provider calls with a default of 8000 ms and per-call override via `opts.timeoutMs`.
- Normalize and surface errors (ValidationError, TimeoutError, ProviderError, NetworkError) in `errors.ts` and export helper constructors.
- Write unit tests that use a mock provider to simulate timeouts, network failures, and malformed responses. Use test-friendly factories to set short timeouts when simulating timeouts to keep tests fast.
- Add integration tests that assert the error types and that `raw` provider responses are preserved on `ProviderError`.

## Edge Cases & Testing
- Simulate a provider that never resolves (use a promise that never resolves) and assert `TimeoutError` after configured timeout.
- Simulate network failure by rejecting with a known network error and assert `NetworkError` mapping.
- Simulate provider returning malformed JSON or missing `content` and assert `ProviderError` with `raw` containing the provider response.
- Test invalid arguments: empty role, non-string content, and ensure `ValidationError` is thrown synchronously (not a rejected promise).

## Technical Debt & Risks
- Risk: Unhandled error types or missed edge cases; mitigate with exhaustive tests and contract review
- Debt: Error contracts may need updates for new skill features or providers; track in follow-up stories

## References
- [Skills System Epic](epic.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
Skills API reliably surfaces all errors and timeouts as structured exceptions, using the chosen error shapes. Tests validate behavior, and `errors.ts` documents the types and helper constructors used by callers and skill authors.
