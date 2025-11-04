## Title
Implement Task Skill

## Problem
Users need to send prompts to the LLM and capture responses as part of automated workflows. Without a task skill, playbooks cannot programmatically interact with the LLM, making agent steps less flexible and less automatable.

## Solution
Implement a built-in skill called `task` that allows users to send a prompt to the LLM and receive a response. The skill will use the SkillApi's `sendRequest` method, support specifying the prompt, role, and model, and return the LLM's reply as a string. Usage: `@task --prompt "Summarize this text" --model "gpt-4o"`.

## Acceptance Criteria
- All tests are passing.
- The task skill is available as a built-in skill and can be invoked from playbooks.
- The skill sends a prompt to the LLM and returns the response.
- Supports specifying prompt, role, and model.
- Errors are surfaced for missing/invalid parameters.
- Unit tests cover normal and error cases.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the task skill interface and parameters
- [ ] Implement the task skill as a built-in skill
- [ ] Validate input and handle errors
- [ ] Integrate with SkillApi's sendRequest
- [ ] Write unit tests for normal and error cases
- [ ] Document usage and add an example

## Open Questions
- Should the skill support additional flags (e.g., temperature, max tokens)?
- Yes, by exposing the full LanguageModelChatRequestOptions interface. The API should support all options, even if not all are used by the skill yet.
- Should the response be stored in a variable for later use?
- Yes, the response should be returned as a string from the skill.
- What roles should be allowed (user, assistant, system)?
- For now, the skill always sends as 'user'. There is no option to configure the role at the skill level. Future support for other roles can be added as needed. The API should support multi-turn conversations with user and assistant messages (accepting the array of messages). The skill has to get the active context from the backend and concatenate it with the current prompt.

## Additional Info & References
- Example usage: `@task --prompt "Summarize this text" --model "gpt-4o"`
- Risks: prompt injection, invalid model/role
- Testability: unit tests with mock SkillApi
- See also: SkillApi usage examples, developing guideline
- [VS Code LLM API Reference](https://code.visualstudio.com/api/references/vscode-api#lm)

- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Create a new built-in skill in `src/skills/built-in/task.ts`.
- The skill exports a `Skill` object with `name: 'task'`, a description, and an async `execute` function.
- The `execute` function receives the SkillApi and params. Params must expose the full `LanguageModelChatRequestOptions` interface (see below), plus required `prompt` and optional `role` and `model`.
- Validate input; throw errors for missing/invalid params.
- The SkillApi must support `sendRequest(messages, options)` where `messages` is an array of user and assistant messages, and `options` is the full `LanguageModelChatRequestOptions` object. This enables future multi-turn and advanced LLM features.
- The skill itself always sends as 'user' (no role configuration at the skill level). The prompt is always sent as a user message.
- When the skill is executed, it should fetch the active context from the backend (using a new API), concatenate the context with the current prompt, and send the full message array to the LLM.
- The API should support all fields from LanguageModelChatRequestOptions, even if only a subset is used by the skill at the moment.
- Error handling should be simple (e.g., missing/invalid prompt). No granular errors for unsupported options at this stage.
- Unit tests for the API must cover all supported features. Unit tests for the skill should only cover the currently supported behavior (user prompt only).
- Documentation in the code should clearly state which fields are currently supported and which are ignored. The ticket should focus on requirements and design.
- Return the response string.
- Add unit tests using the centralized mock SkillApi.
- Document usage in the skill and in the testing best practices doc.
- Tool-calling support will be implemented in a separate story (see below).
- Cancellation token support is not needed in the skill, but must be handled in the VS Code extension to cancel ongoing LLM requests if a playbook is stopped. This should be tracked in the papercuts epic.


## Important code example

### Proposed Interface

```ts
// src/skills/built-in/task.ts
import { Skill, SkillApi, SkillParams } from '../types';

// Expose the full LanguageModelChatRequestOptions interface for params
export interface TaskSkillParams extends LanguageModelChatRequestOptions {
  prompt: string;
  model?: string;
}

export const taskSkill: Skill = {
  name: 'task',
  description: 'Send a prompt to the LLM and return the response. Exposes all LanguageModelChatRequestOptions. Only user prompts are supported for now. The skill fetches the active context from the backend, concatenates it with the current prompt, and sends the full message array.',
  async execute(api: SkillApi, params: TaskSkillParams): Promise<string> {
    const { prompt, model, ...options } = params;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Missing or invalid prompt');
    }
    // Fetch active context from backend (pseudo-code, replace with real API call)
    const contextMessages = await api.getActiveContext(); // [{ role: 'user', content: '...' }, ...]
    // Always send as user
    const messages = [...contextMessages, { role: 'user', content: prompt }];
    // Pass all options to sendRequest
    const result = await api.sendRequest(messages, { model, ...options });
    return result.response;
  }
};
```


// Document that all LanguageModelChatRequestOptions fields are supported, e.g. modelOptions, toolMode, tools, justification, etc.

// The API and interface are designed to support an array of user and assistant messages for multi-turn conversations. The skill always sends as user and fetches the active context from the backend. Only user prompts are supported for now.

// Tool-calling support (tools/toolMode) will be implemented in a separate story.

// Cancellation token support is handled in the VS Code extension, not in the skill.

### Usage Example

```ts
@task --prompt "Summarize this text" --model "gpt-4o" --modelOptions '{"temperature":0.7,"max_tokens":256}'
```

### Next Steps

- Create a new story for tool-calling support, inspired by this one.
- Add a papercut/epic item to track cancellation token handling in the VS Code extension (cancel LLM requests if playbook is stopped).

### Task Skill Example
```ts
// src/skills/built-in/task.ts
import { Skill, SkillApi, SkillParams } from '../types';

export const taskSkill: Skill = {
  name: 'task',
  description: 'Send a prompt to the LLM and return the response. Only user prompts are supported for now. The skill fetches the active context from the backend, concatenates it with the current prompt, and sends the full message array.',
  async execute(api: SkillApi, params: TaskSkillParams): Promise<string> {
    const { prompt, model, ...options } = params;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Missing or invalid prompt');
    }
    // Fetch active context from backend (pseudo-code, replace with real API call)
    const contextMessages = await api.getActiveContext();
    const messages = [...contextMessages, { role: 'user', content: prompt }];
    const result = await api.sendRequest(messages, { model, ...options });
    return result.response;
  }
};
```

### Skill Object Example
```ts
// skills/file.ts
// all params are translated into flags
// @file --action "write" --path "./test.json" --content "hello world"
export interface Params {
  action: "read" | "write" | "delete";
  path: string;
  content?: string;
}

// Global type
export interface Skill {
  name: string;
  description: string;
  execute: (params: Params) => Promise<string>;
  // Params type should be exported for system introspection (consider Zod for future evolution)
}

export const fileSkill: Skill = {
  description: "Read, write and delete files.",
  async execute(params) {
    // Implementation logic here
    // Return output as string
    return "<result>";
  }
};
```

**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.