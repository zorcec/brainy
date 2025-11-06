# Story: Fix bugs in skills and context logic

**Status:** Done

## Context
Three bugs were identified in the playbook execution system:
1. Playbook execution fails with `o.map is not a function` error
2. Debug flag causes `Converting circular structure to JSON` error
3. Context selection documentation was misleading

## Goal
- Fix three bugs described in tasks-collection.md:
  1. Playbook execution fails at step 3: `o.map is not a function` in `modelClient.ts`.
  2. Debug flag causes error: `Converting circular structure to JSON`.
  3. Multiple contexts selection logic is too complex; only one context should be selectable at a time.

## Implementation Summary

### Bug 1: o.map error (Already Fixed)
This bug was already resolved in story 004-fix-prompt-skill-error.md. The issue was that `getAllAvailableTools()` was passing `LanguageModelToolInformation[]` instead of `LanguageModelChatTool[]` to the VS Code LM API. The fix properly converts the tool types by extracting only the required properties (name, description, inputSchema).

### Bug 2: Debug flag circular JSON error (Fixed)
**Root Cause:** When using `@task --debug`, the skill tried to serialize the context for debugging, but the context could contain circular references causing `JSON.stringify` to fail.

**Solution:** Updated `task.ts` to use a custom JSON replacer that:
- Detects circular references using `WeakSet`
- Replaces circular references with `'[Circular Reference]'`
- Truncates long strings (>500 chars) to prevent overwhelming output
- Safely serializes the entire context dump

**Files Changed:**
- `packages/vscode-extension/src/skills/built-in/task.ts`: Added safe serialization with circular reference detection
- `packages/vscode-extension/src/skills/built-in/task.test.ts`: Added 3 new tests for debug mode functionality

### Bug 3: Context selection complexity (Fixed)
**Root Cause:** The implementation already enforced single context selection via the `selectedContextName` variable. The issue was misleading documentation in the completion provider.

**Solution:** Updated `completionProvider.ts` to clarify that only one context can be active at a time.

**Files Changed:**
- `packages/vscode-extension/src/markdown/completionProvider.ts`: Updated context skill description from "Select one or more agent contexts" to "Select an agent context for the session. Only one context can be active at a time."

## Acceptance Criteria
- ✅ Playbook execution works without `o.map` error (already fixed)
- ✅ Debug flag does not cause circular JSON error
- ✅ Context selection logic documentation is clear and accurate
- ✅ All 533 unit tests pass (added 3 new tests for debug mode)

## Testing
- **Unit tests:** All 533 tests passing (3 new tests added for debug mode)
- **Debug mode tests:**
  - Verifies context is dumped without calling LLM
  - Verifies circular references are handled safely
  - Verifies long strings are truncated with `[truncated]` marker

## Outcome
- All three bugs are fixed and tested
- Context selection documentation is clear
- Debug mode works reliably without errors

## Original Error Messages

Bug 1:
```
Playbook execution failed at step 3: Error: LLM request failed: o.map is not a function at defaultProvider (/root/workspace/brainy/packages/vscode-extension/src/skills/modelClient.ts:193:10) at processTicksAndRejections (node:internal/process/task_queues:105:5)
```

Bug 2:
```
Error at step 3: Converting circular structure to JSON
    --> starting at object with constructor 'Object'
    |     property 'context' -> object with constructor 'Array'
    |     index 2 -> object with constructor 'Object'
    --- property 'content' closes the circle
```