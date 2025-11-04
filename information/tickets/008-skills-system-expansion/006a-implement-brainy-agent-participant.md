---
title: "Implement Custom VS Code Chat Participant: brainy-agent"
description: "Story to implement a custom chat participant in VS Code with dynamic context injection and simplified Skill API."
status: "draft"
created: "2025-11-04"
---

# Story: Implement Custom VS Code Chat Participant: brainy-agent

## Background
- Brainy needs a custom chat participant in VS Code to enable advanced agent workflows and context control.
- The participant must allow dynamic context injection for every LLM request, supporting agent context messages (API responses, included files, etc.) and user messages, with clear separation.
- The Skill API for sending requests should be simplified to only accept the user message; context is managed internally.

## Goals
- Register a custom chat participant in VS Code with the id `brainy-agent`.
- Allow the participant to receive user messages and inject the correct context for each LLM request:
  - Agent messages (API responses, included context files, etc.) are sent as `{ role: 'agent', content: ... }`.
  - The current user message is sent as `{ role: 'user', content: ... }` as the last message.
- Simplify the Skill API `sendRequest` to only require the user message as input.
- Ensure the backend builds the full context array in the correct order and format for the LLM.

## Requirements
- Use `vscode.chat.createChatParticipant('brainy-agent', handler)` to register the participant.
- The handler must:
  - Accept the user message from the chat view.
  - Retrieve the current agent context using the context skill APIs (`getContext`, `contextNames`, etc.).
  - Build the LLM input as an array:
    - All agent messages (API responses, included files, etc.) as `{ role: 'agent', content: ... }` in chronological order.
    - The current user message as `{ role: 'user', content: userMessage }` as the last message.
  - Do not include previous user messages in the agent context; only the current user message is sent as `role: 'user'`.
  - Call the LLM with the full context array.
  - Stream the LLM response back to the chat view.
- The Skill API `sendRequest` should have the signature: `sendRequest(userMessage: string): Promise<string>`.
- Context selection and retrieval are handled internally; the user of the API only provides the message.
- The participant must update its context selection before each request if needed (using `selectContext`).
- All context messages must be tracked in chronological order and labeled by role.

## Implementation Plan
- [ ] Register the custom participant with id `brainy-agent` using `vscode.chat.createChatParticipant`.
- [ ] Implement the handler to:
  - Accept the user message.
  - Retrieve agent context messages via the context skill.
  - Build the context array: all agent messages first, then the current user message as the last entry.
  - Call the LLM and stream the response.
- [ ] Simplify the Skill API `sendRequest` to only accept the user message.
- [ ] Ensure context selection can be updated before each request.
- [ ] Add unit tests for participant registration, context building, and LLM request logic.
- [ ] Document usage and provide code examples.

## Acceptance Criteria
- The `brainy-agent` participant is available in the VS Code chat view.
- Sending a message to the participant triggers the handler, which builds and sends the correct context to the LLM.
- The Skill API `sendRequest` only requires the user message; context is handled internally.
- All agent context messages are included in the LLM request as `{ role: 'agent', content: ... }`, followed by the current user message as `{ role: 'user', content: ... }`.
- No previous user messages are included in the agent context.
- Unit tests cover registration, context building, and LLM request logic.
- Usage is documented with an example.

## Example Code
```ts
// Register the custom participant
defineParticipant() {
  const participant = vscode.chat.createChatParticipant('brainy-agent', async (request, context, response, token) => {
    // 1. Accept user message
    const userMessage = request.prompt;
    // 2. Retrieve agent context messages (API responses, included files, etc.)
    const agentMessages = getAgentContext(); // [{ role: 'agent', content: ... }]
    // 3. Build the context array: agent messages first, then user message
    const messages = [...agentMessages, { role: 'user', content: userMessage }];
    // 4. Send to LLM
    const llmResponse = await chat.sendRequest(messages);
    // 5. Stream response back
    response.markdown(llmResponse.text);
  });
}

// Simplified Skill API
async function sendRequest(userMessage: string): Promise<string> {
  // Internally builds context and sends to LLM
  const agentMessages = getAgentContext();
  const messages = [...agentMessages, { role: 'user', content: userMessage }];
  const llmResponse = await chat.sendRequest(messages);
  return llmResponse.text;
}
```

## Risks & Mitigations
- Incorrect context order, missing roles, or user/agent confusion: Mitigate with unit tests, code review, and clear documentation.
- Skill API confusion: Document the new signature and usage clearly.

## Related Documents
- [Epic: Skills System Expansion and API Definition](../epic.md)
- [Context Manipulation Skill](./006-implement-context-manipulation-skill.md)

## Next Steps
- Review and refine the implementation plan.
- Link this story to the epic and related context skill stories.
- Move to planning and implementation.
