---
title: "SkillApi Usage Examples"
description: "Examples demonstrating how to use the SkillApi for building Brainy skills"
created: "2025-11-03"
---

# SkillApi Usage Examples

This document provides code samples and examples for using the SkillApi in Brainy skills.

## Basic Skill Structure

All skills must implement the `Skill` interface with an `execute` method that receives a `SkillApi` object:

```typescript
import { Skill, SkillParams, SkillApi } from '../types';

export const mySkill: Skill = {
  name: 'my-skill',
  description: 'Brief description of what the skill does',
  
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    // Skill implementation
    return 'result string';
  }
};
```

## Using sendRequest()

The `sendRequest()` method allows skills to send prompts to LLM models:

```typescript
export const summarizeSkill: Skill = {
  name: 'summarize',
  description: 'Summarizes text using an LLM',
  
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    const { text, model } = params;
    
    // Send a user prompt to the model
    const response = await api.sendRequest('user', `Summarize: ${text}`, model);
    
    return response.response;
  }
};
```

### With Default Model

```typescript
// Uses the currently selected model
const response = await api.sendRequest('user', 'What is TypeScript?');
```

### With Specific Model

```typescript
// Override with a specific model
const response = await api.sendRequest('user', 'Explain closures', 'gpt-4o');
```

### Assistant Role

```typescript
// Send as assistant message (for context building)
const response = await api.sendRequest('assistant', 'Previous context here');
```

## Using selectChatModel()

The `selectChatModel()` method sets the global model for subsequent requests:

```typescript
export const switchModelSkill: Skill = {
  name: 'switch-model',
  description: 'Switches the active LLM model',
  
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    const { modelId } = params;
    
    // Select a model globally
    await api.selectChatModel(modelId);
    
    return `Switched to model: ${modelId}`;
  }
};
```

## Combined Example: Research Skill

A more complex skill that uses both API methods:

```typescript
export const researchSkill: Skill = {
  name: 'research',
  description: 'Researches a topic using multiple LLM queries',
  
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    const { topic, model = 'gpt-4o' } = params;
    
    // Select the model for all subsequent requests
    await api.selectChatModel(model);
    
    // Step 1: Get an overview
    const overviewResponse = await api.sendRequest(
      'user',
      `Provide a brief overview of: ${topic}`
    );
    
    // Step 2: Ask for key concepts
    const conceptsResponse = await api.sendRequest(
      'user',
      `Based on the overview: "${overviewResponse.response}", list the key concepts.`
    );
    
    // Step 3: Synthesize results
    const synthesisResponse = await api.sendRequest(
      'user',
      `Synthesize this research:\n\nOverview: ${overviewResponse.response}\n\nKey Concepts: ${conceptsResponse.response}`
    );
    
    return synthesisResponse.response;
  }
};
```

## Error Handling

Skills should let errors propagate naturally. The framework will catch and display them:

```typescript
export const validateSkill: Skill = {
  name: 'validate',
  description: 'Validates input with LLM',
  
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    const { input } = params;
    
    if (!input) {
      throw new Error('Input is required');
    }
    
    try {
      const response = await api.sendRequest('user', `Validate: ${input}`);
      return response.response;
    } catch (error) {
      // Errors from sendRequest() are automatically thrown as Error objects
      throw error;
    }
  }
};
```

## Using in Playbooks

Skills with SkillApi can be invoked from markdown playbooks:

```markdown
# Research Playbook

@research --topic "hybrid search" --model "gpt-4o"

The research skill will use the SkillApi to query the LLM and return results.
```

## Testing Skills

When testing skills, provide a mock SkillApi:

```typescript
import { SkillApi } from '../types';

const mockApi: SkillApi = {
  async sendRequest(role, content, modelId) {
    return { response: `Mock response for: ${content}` };
  },
  async selectChatModel(modelId) {
    // No-op for tests
  }
};

// Use in tests
test('my skill works', async () => {
  const result = await mySkill.execute(mockApi, { param: 'value' });
  expect(result).toBe('expected result');
});
```

## API Reference

### SkillApi Interface

```typescript
export interface SkillApi {
  /**
   * Sends a request to the selected or specified model.
   * 
   * @param role - Message role ('user' or 'assistant')
   * @param content - Message content
   * @param modelId - Optional model ID override
   * @returns Promise with response object containing 'response' field
   * @throws Error on timeout or provider failures
   */
  sendRequest(role: 'user' | 'assistant', content: string, modelId?: string): Promise<{ response: string }>;

  /**
   * Selects a chat model globally for subsequent requests.
   * 
   * @param modelId - Model ID to select (e.g., 'gpt-4o', 'claude-3')
   * @returns Promise that resolves when the model is selected
   */
  selectChatModel(modelId: string): Promise<void>;
}
```

## Implementation Notes

- **No IPC/Messaging**: Skills run in the same process as the extension, so no inter-process communication is needed
- **Simple Wrapper**: The SkillApi is a simple wrapper around existing `modelClient` and `sessionStore` modules
- **Transparent Injection**: The API is automatically injected when skills are executed via `executeSkill()`
- **Error Propagation**: Errors from the API are thrown as standard Error objects

## Next Steps

Future stories will expand the SkillApi with additional methods for:
- Context manipulation
- File operations (beyond the built-in file skill)
- Variable management
- Task execution

---
