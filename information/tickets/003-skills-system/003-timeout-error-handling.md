
## Title
Error Handling and Timeout Logic for Skills

## Context
Skills must receive clear feedback for all failures, including timeouts, network issues, and provider errors. Reliable error handling is essential for safe skill development and debugging.

## Goal
Ensure all errors and timeouts in skill API calls are handled consistently using plain `Error` objects with descriptive messages. Use an 8000ms default timeout (configurable per-call) and preserve original errors when re-throwing.

## Implementation Plan
- Implement timeout logic for provider calls with a default of 8000ms and per-call override via `opts.timeoutMs`.
- Use plain `Error` objects with descriptive messages for all error cases (validation, timeout, provider, network).
- Preserve and rethrow original errors to maintain stack traces (see developing guidelines).
- Write unit tests that simulate timeouts, network failures, and malformed responses using mock providers.
- Tests should use short timeout values (e.g., 50ms) to keep tests fast while validating timeout behavior.

## Edge Cases & Testing
- Simulate a slow provider (200ms delay) with 50ms timeout and assert error message contains "timed out".
- Simulate network failure by throwing error with "ECONNREFUSED" and assert error is preserved.
- Simulate provider returning malformed response and assert error is thrown.
- Test invalid arguments: empty role, non-string content, and ensure `Error` is thrown with descriptive message.
- Verify original error instances are preserved when re-throwing (not wrapped in new errors).

## Technical Debt & Risks
- Risk: Timeout values may need tuning based on real provider response times
- Debt: May need to add retry logic in future stories

## References
- [Skills System Epic](epic.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
Skills API reliably handles all errors using plain `Error` objects with descriptive messages. Timeouts work correctly with configurable defaults. Tests validate all error scenarios with good coverage.
