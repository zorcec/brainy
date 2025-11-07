# Story: Enable built-in tools for every LLM call

## Context
<PLACEHOLDER: Add any relevant context about LLM calls and tool usage>

## Goal
- Ensure every LLM call can use built-in tools by default.

## Acceptance Criteria
- All LLM calls have access to built-in tools unless explicitly disabled.

## Implementation Plan
- Audit current LLM call logic for tool usage.
- Update logic to enable built-in tools by default.
- Add option to disable built-in tools if needed.

## Edge Cases & Testing
- Test LLM calls with and without built-in tools enabled.
- Validate tool usage in various scenarios.

## Risks & Technical Debt
- Risk: Unintended tool usage or conflicts.
- Mitigation: Add tests and review tool integration logic.

## Outcome
- All LLM calls can use built-in tools by default, with option to disable.

---

## Implementation Notes & Code Examples

- **Where to implement:**
	- Main logic is in `packages/vscode-extension/src/skills/skillApi.ts` and `modelClient.ts`.
	- Types are in `types.ts`.
    - if tools is provided but empty, no tools are used. @task --prompt "test" --tools
    - if tools are provided, only those are used. @task --prompt "test" --tools "tool1,tool2"

- **Key code changes:**
   1. Default tool inclusion: If `tools` is not provided, include all built-in tools by default in LLM calls.
   2. Document this default in code and docs.

### Example code changes


**types.ts**
```typescript
export interface SendRequestOptions {
		tools?: vscode.LanguageModelChatTool[];
}
```

**Registering a tool:**
```typescript
const fileTool: vscode.LanguageModelChatTool = {
	name: 'file',
	description: 'Read, write, and delete files.',
	inputSchema: {
		type: 'object',
		properties: {
			action: { type: 'string', enum: ['read', 'write', 'delete'] },
			path: { type: 'string' },
			content: { type: 'string' }
		},
		required: ['action', 'path']
	}
};
```

**skillApi.ts**
```typescript
async sendRequest(role, content, model, options) {
		// ...existing code...
		const allTools = await this.getAllAvailableTools();
		const tools = options?.tools ?? allTools;

		const response = await modelSendRequest({
				role,
				content,
				model,
				context: contextMessages,
				tools
		});
		return { response: response.reply };
}
```

**Usage examples in a skill:**
```typescript
// Normal LLM call (tools enabled by default)
const response = await api.sendRequest('user', 'Summarize this', undefined, {});

// LLM call with only the file tool available
const response = await api.sendRequest('user', 'Read ./notes.md using the file tool', undefined, {
	tools: [fileTool]
});

// LLM call with no tools available
const response = await api.sendRequest('user', 'Just answer, do not use tools', undefined, {
	tools: []
});
```

**How tool registration works:**
- When registering a tool, you must provide:
	- `name`: Unique tool name
	- `description`: Clear, concise explanation of what the tool does (shown to the LLM and user)
	- `inputSchema`: JSON schema describing the tool’s parameters
- No other instructions are needed. The description and inputSchema are enough for the LLM to understand and use the tool.
- If you want to guide the LLM to use a tool, you can do so via your prompt/messages, but it is not required for tool registration.

---

**Summary:**
- By default, all LLM calls from skills include all built-in tools unless custom tools are specified.
- This ensures maximum flexibility and safe defaults for all skills.
