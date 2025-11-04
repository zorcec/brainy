## Title
Implement Task Skill

## Problem
Users need to send prompts to the LLM and capture responses as part of automated workflows. Without a task skill, playbooks cannot programmatically interact with the LLM, making agent steps less flexible and less automatable.

## Solution
Implement a built-in skill called `task` that allows users to send a prompt to the LLM and receive a response. The skill will use the SkillApi's `sendRequest` method, which internally uses the VS Code chat participant `agent` to manage context and send messages to the LLM. The skill supports specifying the prompt, model, and returns the LLM's reply as a string. Usage: `@task --prompt "Summarize this text" --model "gpt-4o"`.

## Architecture Overview
- **VS Code Extension**: Implements a custom chat participant with id `agent` that manages LLM communication.
- **Task Skill**: Calls `SkillApi.sendRequest()` with a user prompt.
- **SkillApi**: Bridges the skill to the chat participant, managing context types (agent/assistant/user).
- **Chat Participant**: Builds the full message array with context and sends to VS Code's LLM API.

## Message Flow
1. User invokes `@task --prompt "Summarize this"`
2. Task skill calls `api.sendRequest({ role: 'user', content: 'Summarize this' })`
3. SkillApi retrieves active context from backend:
   - Messages with type `agent` → sent as `{ role: 'agent', content: ... }`
   - Messages with type `assistant` → sent as `{ role: 'assistant', content: ... }`
   - Messages with type `user` → sent as `{ role: 'user', content: ... }`
4. SkillApi forwards to chat participant with full message array
5. Chat participant calls `vscode.lm.sendRequest(model, messages, options, token)`
6. LLM response is streamed back through the participant to SkillApi
7. Task skill receives the complete response as a string

## Acceptance Criteria
- All tests are passing.
- The `agent` chat participant is implemented in the VS Code extension.
- The task skill is available as a built-in skill and can be invoked from playbooks.
- The skill sends a prompt to the LLM via SkillApi's `sendRequest` method.
- SkillApi correctly maps context message types to LLM roles (agent/assistant/user).
- The chat participant builds the full message array and sends it to the LLM.
- Supports specifying prompt and model.
- Errors are surfaced for missing/invalid parameters.
- Unit tests cover normal and error cases.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Implement the `agent` chat participant in the VS Code extension
- [ ] Design the task skill interface and parameters
- [ ] Implement the task skill as a built-in skill
- [ ] Implement SkillApi's `sendRequest` method to bridge to the chat participant
- [ ] Implement context retrieval with proper type mapping (agent/assistant/user)
- [ ] Validate input and handle errors
- [ ] Write unit tests for the skill, SkillApi, and chat participant
- [ ] Document usage and add examples

## Open Questions
- Should the skill support additional flags (e.g., temperature, max tokens)?
  - Yes, by exposing the full LanguageModelChatRequestOptions interface. The API should support all options, even if not all are used by the skill yet.
- Should the response be stored in a variable for later use?
  - Yes, the response should be returned as a string from the skill.
- What roles should be allowed (user, assistant, agent)?
  - The skill always sends as 'user'. Context messages are automatically mapped by their type:
    - Backend type `agent` → LLM role `agent`
    - Backend type `assistant` → LLM role `assistant`
    - Backend type `user` → LLM role `user`
  - The API should support multi-turn conversations with all message types.
- How does the chat participant integrate with the skill?
  - The SkillApi acts as a bridge: skill → SkillApi → chat participant → LLM API.
  - The chat participant receives the full message array from SkillApi and forwards it to `vscode.lm.sendRequest()`.

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
- **VS Code Extension**: Create a custom chat participant with id `agent` using `vscode.chat.createChatParticipant()`.
  - The participant handler receives messages from SkillApi (not from chat UI in this case).
  - It forwards the full message array to `vscode.lm.sendRequest()`.
  - Streams the response back to SkillApi.
  
- **SkillApi**: Implement `sendRequest(message, options)` method.
  - Retrieves active context from backend via a new API endpoint.
  - Maps context message types to LLM roles:
    - `agent` type → `{ role: 'agent', content: ... }`
    - `assistant` type → `{ role: 'assistant', content: ... }`
    - `user` type → `{ role: 'user', content: ... }`
  - Appends the current user message to the array.
  - Calls the chat participant with the full message array and options.
  - Returns the LLM response as a string.
  
- **Task Skill**: Create a new built-in skill in `src/skills/built-in/task.ts`.
  - The skill exports a `Skill` object with `name: 'task'`, a description, and an async `execute` function.
  - The `execute` function receives the SkillApi and params.
  - Params must expose the full `LanguageModelChatRequestOptions` interface, plus required `prompt` and optional `model`.
  - Validate input; throw errors for missing/invalid params.
  - The skill always sends as 'user' (no role configuration at the skill level).
  - Calls `api.sendRequest({ role: 'user', content: prompt }, { model, ...options })`.
  - Returns the response string.
  
- **Error Handling**: Simple validation (e.g., missing/invalid prompt). No granular errors for unsupported options at this stage.

- **Testing**:
  - Unit tests for the chat participant (mock VS Code LM API).
  - Unit tests for SkillApi's `sendRequest` (mock backend and chat participant).
  - Unit tests for the task skill (mock SkillApi).
  - Integration tests for the full flow.
  
- **Documentation**: Document the architecture, message flow, and usage in code comments and testing best practices doc.

- **Future Work**:
  - Tool-calling support will be implemented in a separate story.
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