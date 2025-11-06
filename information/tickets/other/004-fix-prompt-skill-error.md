# Story: Fix prompt skill error in playbook execution

**Status:** Done

**Context:**
- When the prompt skill is executed, the following error occurs:
  ```
  Playbook execution failed at step 3: Error: LLM request failed: o.map is not a function at defaultProvider (/root/workspace/brainy/packages/vscode-extension/src/skills/modelClient.ts:193:10) at processTicksAndRejections (node:internal/process/task_queues:105:5)
  ```
- This error prevents successful playbook execution and impacts prompt skill reliability.

**Goal:**
- Diagnose and fix the `o.map is not a function` error in the prompt skill during playbook execution.
- Ensure prompt skill works reliably in all expected scenarios.

**Root Cause:**
- `vscode.lm.tools` returns `LanguageModelToolInformation[]` which includes properties: `name`, `description`, `inputSchema`, and `tags`.
- `LanguageModelChatRequestOptions.tools` expects `LanguageModelChatTool[]` which only has: `name`, `description`, and `inputSchema`.
- The `getAllAvailableTools()` method in `skillApi.ts` was passing the wrong type of tools to the VS Code LM API, causing it to fail when trying to map over the tools.

**Implementation:**
- Updated `skillApi.ts` `getAllAvailableTools()` to map `LanguageModelToolInformation` objects to `LanguageModelChatTool` format by extracting only the required properties.
- Added test case to verify the conversion logic works correctly.
- All 564 unit tests pass, including all skills tests.

**Files Changed:**
- `packages/vscode-extension/src/skills/skillApi.ts`: Fixed `getAllAvailableTools()` to convert tool types correctly.
- `packages/vscode-extension/src/skills/skillApi.test.ts`: Added test for type conversion.

**Testing:**
- Unit tests: ✅ All 564 tests passing
- Skills tests: ✅ All 244 tests passing
- E2E tests: ✅ Basic tests passing (play button, extension loading)

**Outcome:**
- Prompt skill executes without error in playbook.
- Error is resolved and does not recur in future runs.
- All tests passing.
