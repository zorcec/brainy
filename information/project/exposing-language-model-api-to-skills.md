---
description: "How to expose the VS Code Language Model API to Brainy skills, enabling direct LLM interaction from custom scripts."
keywords: ["brainy", "skills", "language model API", "LLM", "VS Code extension", "automation", "custom scripts"]
date: "2025-10-30"
---

# Exposing the VS Code Language Model API to Skills

This document explains how Brainy skills (custom scripts in the `./skills` folder) can interact directly with the VS Code Language Model API, enabling advanced automation and LLM-powered workflows.

## Overview

- Brainy skills are custom scripts that implement agent annotations (e.g., `@task`, `@rag-query`, etc.).
- To enable skills to interact with the LLM, expose the VS Code Language Model API through your extension.
- Skills can then send prompts, receive responses, and leverage AI reasoning as part of their execution.

## Implementation Steps

1. **Use the Language Model API in Your Extension:**
   - Select available LLMs using `vscode.lm.selectChatModels`.
   - Build prompts with `LanguageModelChatMessage.User` and `LanguageModelChatMessage.Assistant`.
   - Send requests using `model.sendRequest(messages, options, token)`.

2. **Expose the API to Skills:**
   - Provide a wrapper function in your extension that skills can call to interact with the LLM.

3. **Security and Permissions:**
   - Skills should access the LLM API only through the extension’s controlled interface.
   - Handle errors, rate limits, and user consent as described in the VS Code documentation.

4. **Suggestions:**
    - Document the API for skill authors.
    - Provide utility functions for prompt building and context management.

## Minimal Custom API for Skills

To keep the API simple and secure, expose only the essential methods to skills:

- **sendRequest(type: 'user' | 'assistant', model: string, content: string): Promise<Response>**
   - Sends a message to the LLM as either a user or assistant message.
   - Type is selected by a string literal ('user' or 'assistant').

- **selectChatModel(options): Promise<Model>**
   - Selects the chat model to use (e.g., Copilot, GPT-4o).
   - Options can specify vendor, family, etc.

- **Context Management**
   - `append(name: string, content: string)`: Appends content to a named context.
   - `get(name: string): string`: Retrieves the content of a named context.

This minimal API allows skills to:
- Select the appropriate LLM model.
- Send user or assistant messages to the model.
- Manage named contexts for chaining, isolation, and reuse.

Example usage in a skill:
```ts
const model = await selectChatModel({ vendor: 'copilot', family: 'gpt-4o' });
const response = await sendRequest('user', 'Your prompt here');
append('research', response.text);
const context = get('research');
```

Expand the API only as needed to support new skill features or workflows.

## References
- [VS Code Language Model API Guide](https://code.visualstudio.com/api/extension-guides/ai/language-model)
- [API Reference](https://code.visualstudio.com/api/references/vscode-api#lm)
- [Chat Extension Sample](https://github.com/microsoft/vscode-extension-samples/tree/main/chat-sample)

## Summary

By exposing the Language Model API to Brainy skills, you enable custom automation scripts to leverage LLM capabilities directly, making workflows more powerful and flexible.
