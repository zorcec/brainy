---
title: "Expose VSCode API and Messaging for Skills"
description: "Story to expose a global VSCode API type for skills, including a new sendRequest() function for messaging."
status: "draft"
created: "2025-11-02"
---

# Story: Expose VSCode API and Messaging for Skills

## Background
To enable advanced automation and integration, Brainy skills need access to internal VSCode functions. A simple messaging system is required to communicate between skills (running in isolated Node.js processes) and the main VSCode extension process. The VSCode API interface must be a global type, used by all skills, and include a new `sendRequest()` function for messaging.

## Goals
- Expose a global VSCode API type for skills.
- Add a `sendRequest()` function to the API for messaging with the main process.
- Ensure the system is extendable and easy to use for future features.

## Implementation Plan
- Define a global `VscodeApi` type, used by all skills.
- Extend the API to include `sendRequest()` for messaging.
- Implement a messaging bridge between skill processes and the VSCode extension.
- Document how skills can use the API to trigger VSCode functions and send requests.
- Provide code samples for skill authors.
- Reference related stories and epic.

## Design Decisions & Clarifications

- **API Surface**: The global `VscodeApi` type will only expose `sendRequest` and `selectModel`. No other VSCode extension APIs (notifications, file system, etc.) are included. No versioning or compatibility guarantees.
- **Security**: No security measures, allowlist, or permission model for exposed functions.
- **Error Handling**: Errors from `sendRequest()` will be surfaced by throwing exceptions—no structured error objects.
- **Extensibility**: Future API changes may be breaking; old built-in skills must be updated. No versioning or feature flags.
- **Testing/Mocking**: Only unit tests for now. Add a story to create a testing environment for built-in skills and cover it with tests.
- **Documentation**: Only provide documentation and code samples needed for agents to write skills—no full API reference.
- **IPC Transport**: JSON-over-IPC is the chosen messaging method.
- **Skill Lifecycle**: The messaging helper/wrapper is injected at the beginning and is always available; the API uses it transparently for skills.

## API & Messaging Specification
- Skills receive an injected `vscode` API object of type `VscodeApi`.
- `VscodeApi` includes all existing methods plus the new `sendRequest()` function.
- Messaging bridge uses JSON messages over IPC (or similar) for communication.
- Skill authors call `vscode.sendRequest('functionName', params)` to trigger internal functions.
- Responses and errors are returned as Promises.
- The system is transparent: skill authors do not manage messaging directly.

## References
- [Epic: Skills System Expansion and API Definition](../epic.md)
- [Story: Define Skill API and Implement Basic Skills](./001-define-skill-api.md)
- [Project Overview](../../project/overview.md)

## Acceptance Criteria
- Skills use the global `VscodeApi` type.
- Skills can trigger internal VSCode functions via `sendRequest()`.
- Messaging system is implemented and documented.
- Code samples are provided for skill authors.
- System is minimal, extendable, and transparent to skill authors.

## Out of Scope
- Advanced messaging features (e.g., subscriptions, events)
- External API integrations
- Security/sandboxing for skill execution

## Risks & Mitigations
- Complexity: Keep the API minimal and document clearly.
- Security: Limit exposed functions and validate messages.
- Future extensibility: Design the system for easy extension.

## Next Steps
- Implement the messaging bridge and API wrapper.
- Test with sample skills.
- Expand documentation and examples as needed.

---

## Code Samples

### Global VSCode API Type

```ts
export interface SkillApi {
  sendRequest: (type: "user"|"assistant", content, model?) => Promise<{response: string}>;
  selectChatModel: (vendor: string, family: string) => Promise<void>;
}
```

### Skill Example Using VSCode API

```ts
// skills/notify.ts
export interface Params {
  message: string;
}

export interface Skill {
  name: string;
  description: string;
  execute: (api: SkillApi, params: Params) => Promise<string>;
}

export const notifySkill: Skill = {
  name: "notify",
  description: "Send a notification via VSCode.",
  async execute(api, params) {
    // Select a model globally
    await api.selectChatModel({ vendor: 'copilot', family: 'gpt-4o' });

    // Send a user prompt
    const response = await api.sendRequest('user', 'Summarize the latest research on hybrid search.', 'gpt-4.1');
    return "Notification sent";
  }
};
```

### Messaging Bridge (Extension Side)

```ts
// extension/main.ts
ipc.on('skill-request', async (event, { fn, params }) => {
  let result;
  try {
    if (fn === "selectModel") {
      // logic
    }
    // ...other functions
    event.reply({ result });
  } catch (e) {
    event.reply({ error: e.message });
  }
});
```

### Skill Wrapper Injection

```ts
// skill-loader.ts
function injectVscodeApi(skillModule) {
  const vscodeApi = {
    selectChatModel: (fn, args) => sendMessageToMainProcess({ fn, args }),
    sendRequest: (fn, params) => sendMessageToMainProcess({ fn, params })
  };
  return (params) => skillModule.execute(params, vscodeApi);
}
```

---
