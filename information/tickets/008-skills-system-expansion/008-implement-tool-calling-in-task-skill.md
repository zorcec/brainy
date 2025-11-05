## Title
Implement Automatic Tool-Calling Support in Task Skill

## Problem
The current `task` skill does not support tool-calling, which is required for advanced LLM workflows (e.g., function calling, code execution, or invoking other skills/tools from the LLM). Exposing tool-calling options will enable richer automation and agent capabilities. For maximum flexibility, the task skill should automatically use all available tools by default, unless a specific subset is provided.

## Solution
Implement tool-calling support in the `task` skill by allowing users to specify `tools` (from `LanguageModelChatRequestOptions`).

- By default, the task skill should automatically use all available tools unless a specific `tools` array is provided.
- The skills API must accept a `tools` array.
- Add a new API endpoint to return all available tools for discovery and documentation purposes.
- The skill should pass these options to the LLM API, enabling the LLM to call registered tools as part of its response generation.

## Acceptance Criteria
- All tests are passing.
- The task skill supports `tools`.
- If `tools` is not provided, all available tools are used by default.
- The skills API accepts a `tools` array.
- A new API endpoint returns all available tools.
- Tool-calling is documented and tested.
- Usage examples are provided.

## Tasks/Subtasks
- [ ] Extend the task skill interface to accept `tools`.
- [ ] Update implementation to pass these to the LLM API.
- [ ] If `tools` is not provided, automatically use all available tools.
- [ ] Add a new skill API function to return all available tools.
- [ ] Add unit tests for tool-calling scenarios.
- [ ] Document tool-calling usage and provide examples.


## Design Decisions & Open Questions

- **Tool Exposure:** All available tools are exposed to the LLM by default. No permission or filtering mechanism is implemented at this stage.
- **Error Handling:** Tool execution errors or failures are passed directly to the LLM. The LLM receives error details as part of the tool response.
- **Tool List Consistency:** The list of available tools is a snapshot at the time the getter is called. No additional checks or logic are needed to keep it up to date for consumers.
- **Restrictions:** Tool-calling is not restricted by model, user role, or context. All tools are available to all requests.
- **Edge Cases:** Issues such as circular tool calls, tool timeouts, or tools with side effects are not handled in this implementation and will be addressed in the future if needed.
- **Large/Complex Results:** There are no limits or formatting rules for large or complex tool results at this stage.
- **Result Surfacing:** How tool results are surfaced to the playbook or user will be handled later.

## Additional Info & References
- See [VS Code LLM API Reference](https://code.visualstudio.com/api/references/vscode-api#lm)
- See [Task Skill Story](../007-implement-task-skill.md)

## Proposal
- Extend the `TaskSkillParams` interface to include `tools`.
- Update the `execute` function to pass these options to `api.sendRequest`.
- If `tools` is not provided, fetch and use all available tools automatically.
- Add a new skill API getTools() to return all available tools.
- Add tests and documentation for tool-calling scenarios.


---

## Code Changes

### 1. Extend TaskSkillParams
```ts
interface TaskSkillParams {
	// ...existing fields...
	tools?: LanguageModelTool[];
}
```

### 2. Update Task Skill Implementation
```ts
async function executeTaskSkill(params: TaskSkillParams) {
	const tools = params.tools ?? await getAllAvailableTools();
	const result = await api.sendRequest(model, prompt, {
		...otherOptions,
		tools,
	});
	return result;
}
```


### 3. Example: Updated Skill Implementation
```ts
export const taskSkill: Skill = {
	name: 'task',
	description: 'Send a prompt to the LLM and return the response. Only user prompts are supported. The VS Code extension handles context.',
	async execute(api: SkillApi, params: TaskSkillParams): Promise<SkillResult> {
		const { prompt, model, tools } = params;
		if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
			throw new Error('Missing or invalid prompt');
		}
		// Use all available tools if none are provided
		const resolvedTools = tools ?? await api.getAllAvailableTools();
		const result = await api.sendRequest('user', prompt, model, {
			tools: resolvedTools
		});
		return {
			messages: [{
				role: 'assistant',
				content: result.response
			}]
		};
	}
};
```

*This story is inspired by the task skill implementation and focuses specifically on automatic tool-calling support as described in the VS Code LLM API.*
