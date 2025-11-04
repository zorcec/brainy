
# Implement Task Skill (Revised)

## Problem
Users need to send prompts to the LLM and capture responses as part of automated workflows. Without a task skill, playbooks cannot programmatically interact with the LLM, making agent steps less flexible and less automatable.


## Solution
Implement a built-in skill called `task` that allows users to send a prompt to the LLM and receive a response. The skill uses the SkillApi's `sendRequest` method, sending the prompt as a user message (internally always with role 'user'). The VS Code extension handles context; the skill only sends the user prompt and returns the LLM's reply. If the `model` parameter is not provided, the globally selected model is used. All LLM errors are surfaced directly to the user. The returned message always uses role: 'assistant'.

### Requirements and Clarifications
- **API Signature**: The skill always calls `api.sendRequest('user', prompt, model)` internally. The API signature remains as `sendRequest(role: 'user' | 'assistant', content: string, modelId?: string)`, but the skill only exposes `prompt` and optional `model` to the user.
- **Model Parameter**: If `model` is not provided, the globally selected model is used. This should be explicit in requirements and error handling.
- **Return Role**: The returned message always uses `role: 'assistant'`, regardless of LLM/tool internals.
- **Extensibility**: The API should support additional LLM options (e.g., temperature, max_tokens) for future use, but the task skill itself does not expose them for now.
- **Error Handling**: All LLM errors are surfaced directly to the user, not wrapped or masked.
- **Testing Scope**: Tests must cover normal, error, and edge cases, including empty prompt, invalid model, and LLM timeouts.

## Architecture Overview
- **Task Skill**: Calls `api.sendRequest(prompt, model)` with the user prompt.
- **SkillApi**: Bridges the skill to the VS Code extension, which manages context and LLM communication.
- **VS Code Extension**: Handles context, builds the full message array, and sends to the LLM API.

## Message Flow
1. User invokes `@task --prompt "Summarize this"`
2. Task skill calls `api.sendRequest(prompt, model)`
3. SkillApi forwards the request to the extension, which handles context and LLM communication.
4. The LLM response is returned to the skill.
5. The skill returns the response as a message in the `messages` array.


## Acceptance Criteria
- The task skill is available as a built-in skill and can be invoked from playbooks.
- The skill sends a prompt to the LLM via SkillApi's `sendRequest` method, always using role 'user' internally.
- The VS Code extension handles context and message array construction.
- Supports specifying prompt and model. If model is not provided, the globally selected model is used.
- Errors are surfaced for missing/invalid parameters and all LLM errors are surfaced directly to the user.
- Unit tests cover normal, error, and edge cases (including empty prompt, invalid model, and LLM timeouts).
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the task skill interface and parameters
- [ ] Implement the task skill as a built-in skill
- [ ] Validate input and handle errors
- [ ] Write unit tests for the skill
- [ ] Document usage and add examples

## Important Code Example

```typescript
// src/skills/built-in/task.ts
import type { Skill, SkillApi, SkillParams, SkillResult } from '../types';

export const taskSkill: Skill = {
  name: 'task',
  description: 'Send a prompt to the LLM and return the response. Only user prompts are supported. The VS Code extension handles context.',
  async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
    const { prompt, model } = params;
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Missing or invalid prompt');
    }
  // Internally always use role 'user' for the prompt
  const result = await api.sendRequest('user', prompt, model); // Only those two parameters should be supported for the user
    return {
      messages: [{
  // Always return as 'assistant' role
  role: 'assistant',
        content: result.response
      }]
    };
  }
};
```

## Usage Example

```markdown
@task --prompt "Summarize this text" --model "gpt-4o"
```

---

**Summary:**  
The task skill sends the user prompt to the LLM using `api.sendRequest(prompt, model)`. The VS Code extension handles context. The skill returns the LLM's reply as a message in the `messages` array. This matches the current skills API and architecture.