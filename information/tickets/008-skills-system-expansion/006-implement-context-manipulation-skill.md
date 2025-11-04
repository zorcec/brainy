## Title
Implement Context Manipulation Skill

## Problem
Users need to control and isolate agent context within Brainy playbooks. Without a context manipulation skill, workflows risk context leakage, lack of reproducibility, and cannot switch or combine contexts programmatically. This limits advanced automation and makes debugging harder.

## Solution
Implement a built-in skill called `context` that allows users to switch to or create named agent contexts within a playbook. The skill accepts one or more context names. If a context exists, it is switched to; if it does not exist, a new one is created. If multiple names are provided, all provided context names are saved in the VS Code extension for later use. **This skill does not concatenate or manipulate contexts; it only selects and stores context names for the current playbook execution so other skills can access them.**

### API Requirements
- `contextNames()`: Returns an array of all selected context names.
- `getContext()`: Returns an array of objects, each with `{ name, messages }`, for all currently selected contexts.
- `selectContext(names: string[])`: Sets and saves the selected context names for the session.

## Context Tracking & LLM API Structure

- All messages in the context must be tracked in chronological order, each labeled by type: `user` or `assistant`.
- Use an array of objects, each with a `role` ("user" or "assistant") and `content` (string), matching the VS Code LLM API requirements.
- Example structure:
  ```ts
  const context = [
    { role: 'user', content: 'Hello!' },
    { role: 'assistant', content: 'Hi, how can I help you?' }
  ];
  // When sending to the LLM:
  await chat.sendRequest(context);
  ```
- Do not concatenate all text; always keep the array structure for correct LLM context handling.

## Acceptance Criteria
- All tests are passing.
- The context skill is available as a built-in skill and can be invoked from playbooks.
- The skill switches to an existing context or creates a new one if it does not exist.
- If multiple context names are provided, all names are saved in the extension for later use. The skill does not concatenate or merge contexts.
- The API provides `contextNames()` and `getContext()` as described above, always returning all selected contexts.
- Errors are surfaced if parameters are missing or invalid.
- Unit tests cover all actions and error cases.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the context skill interface and parameters
- [ ] Implement the context skill as a built-in skill
- [ ] Support switching to or creating contexts by name
- [ ] Save all provided context names in the extension for later use
- [ ] Implement `contextNames()` and `getContext()` API (getContext returns all selected contexts)
- [ ] Implement `selectContext()`, `contextNames()` and `getContext()` API (getContext returns all selected contexts)
- [ ] Validate input and handle errors
- [ ] Integrate with agent context state
- [ ] Write unit tests for all actions and error cases
- [ ] Document usage and add an example

## Open Questions & Clarifications
- Context names are not validated against a known list; any name is accepted.
- If a context does not exist, it is created.
- If multiple names are provided, all are saved for later use; no concatenation or merging is performed.

## Additional Info & References
- Example usage: `@context --name "research"`
- Testability: unit tests with mock agent context
- See also: context control syntax in project docs

- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Create a new built-in skill in `src/skills/built-in/context.ts`.
- The skill exports a `Skill` object with `name: 'context'`, a description, and an async `execute` function.
- The `execute` function receives the SkillApi and params (expects one or more context names).
- If a context exists, switch to it; if not, create it.
- If multiple names are provided, save all names in the extension for later use. Do not concatenate or merge contexts.
- Implement the API:
  - `contextNames()`: Returns all saved context names.
  - `getContext()`: Returns an array of objects, each with `{ name, messages }`, for all selected contexts.
  - `selectContext(names: string[])`: Sets and saves the selected context names for the session.
- Validate input; throw errors for missing/invalid params.
- Update agent context state as needed.
- Return a confirmation string (e.g., `Context set to: research` or `Contexts selected: research, summary`).
- Add unit tests using the centralized mock SkillApi and agent context mock.
- Document usage in the skill and in the testing best practices doc.

## Implementation Clarifications

- **Context Storage & Limits:**
  - All context is kept in memory for the playbook run session; no persistence or truncation.
  - No message or token limit is enforced for now. (Add to papercuts epic: support for LLM input limits and truncation.)
  - If context exceeds LLM input limits, handling/truncation is a future improvement. (Papercuts epic)

- **Context Naming & Lifecycle:**
  - Context names are case-sensitive.
  - Switching to the current context is allowed; it simply re-selects it. No parallel step execution.
  - Contexts exist as long as the session is active; no delete/archive yet.

- **Concurrency & Isolation:**
  - Only one playbook/user can access or modify a context at a time. No concurrent modification.

- **Context Selection Only:**
  - When multiple context names are provided, they are only stored for access by other skills; no merging, deduplication, or manipulation is performed.

- **Error Handling:**
  - All context is in memory, so storage errors are not expected.
  - Invalid names result in an error. Use regex validation at playbook parse time for live feedback.
  - (Papercuts epic: Playbook cannot be executed if there are errors in the playbook.)

- **Security & Privacy:**
  - No special privacy or security considerations for context storage or switching at this time.

## Important code example

### Context Skill Example
```ts
// src/skills/built-in/context.ts
import { Skill, SkillApi, SkillParams } from '../types';


// In-memory store for selected context names (for session)
let selectedContextNames: string[] = [];

export const contextSkill: Skill = {
  name: 'context',
  description: 'Select one or more agent contexts for the session.',
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    const { names } = params; // names: string | string[]
    if (!names) throw new Error('Missing context name(s)');
    const nameList = Array.isArray(names) ? names : [names];
    selectedContextNames = nameList;
    if (nameList.length === 1) {
      return `Context set to: ${nameList[0]}`;
    } else {
      return `Contexts selected: ${nameList.join(', ')}`;
    }
  }
};

// API to set and save selected context names
export function selectContext(names: string[]): void {
  if (!Array.isArray(names) || names.length === 0) throw new Error('Missing or invalid context names');
  selectedContextNames = names;
}

// API to get all selected contexts and their messages
export function getContext(): Array<{ name: string, messages: any[] }> {
  // Example: fetch messages for each context name (pseudo-code)
  return selectedContextNames.map(name => ({
    name,
    messages: getMessagesForContext(name) // Implement this to fetch the actual messages
  }));
}

// Placeholder for actual message retrieval logic
function getMessagesForContext(name: string): any[] {
  // Fetch or load the messages for the given context name
  return [];
}
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