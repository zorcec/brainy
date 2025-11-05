# Story: LLM Request Handling and Validation

## Summary
Enhance LLM request management and markdown validation in the Brainy system to improve reliability and user feedback.

## Motivation
- Ongoing LLM requests are not cancelled when a playbook is stopped, wasting compute and causing confusion.
- Invalid Brainy markdown syntax is not clearly validated, leading to user errors.

## Acceptance Criteria
- LLM request cancellation and abort signal handling are managed internally in the Skill API.
- If the notebook or playbook is stopped, or an error is thrown, all in-flight LLM calls are aborted using an internal abort signal.
- No orphaned or zombie LLM requests remain after stopping a playbook.
- User receives clear feedback if a request is cancelled.
- Invalid syntax such as `@model "gpt-4.1" e` results in a clear validation error.

**Clarifications:**
- No user feedback is needed for cancelled requests; cancellation happens in the background.
- Only one LLM request can be in-flight per playbook session; abort always cancels the current one.
- Abort logic should cancel immediately with an error, no retries.
- Markdown validation should report all errors together, as currently implemented; ensure all error types are covered.
- No special cases for system/cleanup tasks; all requests can be aborted.
- e2e tests should cover user-initiated cancellation scenarios only.

## Out of Scope
- Changes to LLM backend models unrelated to request cancellation or validation.

## Additional Notes
Ensure robust error handling for LLM request cancellation. Reference: [VS Code LLM API Reference](https://code.visualstudio.com/api/references/vscode-api#lm).


### Example: Abortable LLM Requests (Separation of Concerns)

```ts
// In skillApi.ts
export function createSkillApi(/* ... */): SkillApi {
  return {
	async sendRequest(role, content, modelId, options) {
	  const abortSignal = options?.abortSignal;
	  const response = await modelSendRequest({
		role,
		content,
		modelId,
		tools: options?.tools,
		signal: abortSignal
	  });
	  return { response: response.reply };
	}
  };
}

// In VS Code extension logic (e.g., playbookExecutor.ts)
const abortController = new AbortController();
// Pass abortController.signal to sendRequest
await skillApi.sendRequest('user', prompt, model, { tools, abortSignal: abortController.signal });

// When playbook is stopped:
abortController.abort(); // This cancels the in-flight LLM request
```


### Example: Markdown Validation

```ts
// In the playbook parser
if (/^@model\s+"[^"]+"\s+e/.test(line)) {
	errors.push({
		message: 'Invalid @model syntax: unexpected trailing characters.',
		line: lineNumber
	});
}
```
