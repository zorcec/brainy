## Title
Skills System (VS Code extension — simple JavaScript skills)

## Blogline (Short Abstract)
Provide a minimal, developer-friendly skills system embedded in the VS Code extension that lets extension authors write plain JavaScript skills. The extension exposes a small API to each skill (injected at import time) and executes skills locally in a controlled, simple runtime. This system is intentionally minimal so it can be used quickly by extension authors and later extended for agent workflows inside .md files and Copilot integration.

## References
- [Project Overview](../../project/overview.md)
- [Exposing Language Model API to Skills](../../project/preparation/exposing-language-model-api-to-skills.md)
- [Annotations Workflow](../../project/preparation/annotations-workflow.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Audience & Stakeholders
## Title
Skills API (VS Code extension) — implement only selectChatModel and sendRequest

Blogline
Implement and fully test two minimal runtime APIs exposed by the VS Code extension to tests and future skill code:
- `api.selectChatModel(modelId: string)` — saves the chosen model id into extension context
- `api.sendRequest(role: 'user' | 'assistant', content: string) -> Promise<{ reply: string, raw: any }>` — sends a message to the selected model (or default) and returns the model reply and raw response

All code and module structure must follow the parser module style:
- Use pure functions and composition, avoid classes.
- Define all types inside code files, prefer string literals and union types.
- Place test files next to their modules.
- Keep implementations concise, modular, and focused.
- Document public functions and modules clearly.
- See [parser module](../../project/preparation/parser.md) and [developing guideline](../../../../developing-guideline.md) for details.

Scope and intent
- We will implement only these two APIs. No `api.context` and no other helper APIs will be implemented for the MVP. No real skills will be added to the extension; tests will simulate skill behavior by invoking the APIs directly.

Audience
- Extension engineers and QA who will build and validate the integration surface for future skills.

Design principles
- Minimal: two public API functions only. Keep the implementation small.
- Test-first: comprehensive unit and integration tests will validate behavior; tests act as usage examples.
- Safe: provider credentials and network calls go through a single audited path with timeouts and explicit error handling.

Contract (source of truth)
- `api.selectChatModel(modelId: string): void` — store model id in extension context/session; used by subsequent `sendRequest` calls.
- `api.sendRequest(role: 'user' | 'assistant', content: string): Promise<{ reply: string, raw: any }>` — forwards content to configured/selected model and returns normalized reply + raw provider response. Errors must be surfaced as structured exceptions.

Non-goals / out-of-scope
- No skill authoring UI, no skill loader, no skill execution runtime.  
- No additional helper APIs (openDocument, runShell, etc.).  
- No marketplace, RBAC, or remote hosting for MVP.

Minimal success (MVS)
- The two APIs are implemented and have comprehensive tests validating: model selection persistence, successful request/response flow, error handling, and timeout behavior.

Test strategy (required)
- Unit tests:
  - `selectChatModel` stores and retrieves selected model id; subsequent `sendRequest` uses it.
  - `sendRequest` forms requests correctly, handles `role` properly, returns `{ reply, raw }`.
  - `sendRequest` error mapping: provider error, invalid args.

- Integration tests (mocked provider):
  - Mock the model client/provider to return canned responses; verify end-to-end `sendRequest` behavior.
  - Simulate model switch and validate subsequent calls target the new model id.

- E2E-style harness tests:
  - Simulate a skill-like test harness that calls `selectChatModel` and `sendRequest` and asserts flows. No real skill files executed.

Stories (implementation + tests)
1) Implement model selection storage
   - `selectChatModel` writes to extension context/storage. Unit tests for set/get and effect on `sendRequest`.

2) Implement sendRequest interface
   - `sendRequest` forwards to an internal model client. Unit tests for request formation, role handling, return shape, and error mapping.

3) Integration tests with mocked provider
   - Create integration tests using a mocked provider or local mock server to assert end-to-end behavior and model switching.

4) Timeout and error handling tests
   - Tests for provider timeouts and network errors; ensure `sendRequest` rejects with structured error.

5) Test harness simulating skills
   - Build a small harness used only in tests that simulates typical skill usage of the two APIs; include as example in docs.

6) Documentation & examples
   - README with API signatures, examples (from tests), and test run instructions.

Quality gates
- All unit and integration tests must pass in CI before merge. Aim for high coverage on the two APIs.

Open decisions
- Default model id: use `brainy.defaultModel` extension setting or error when no model selected? Recommend `brainy.defaultModel` with sensible default.
- Provider call timeout default (recommend 8s).

Next step
- I can (A) turn these stories into tracked tickets, or (B) implement the APIs and tests in `packages/vscode-extension` now. Which do you want me to do next?

---

## Skills Module Structure & Process Architecture (MVP)

To match the parser's modular, test-adjacent style and project guidelines, use:

- Directory: `packages/vscode-extension/src/skills/`
- Entry: `index.ts` (no exports; API is injected into the skill process)
- Split logic into:
  - `modelClient.ts` (provider call, timeout, error normalization)
  - `sessionStore.ts` (model id persistence)
  - `errors.ts` (typed error wrappers)
- Tests next to code:
  - `index.test.ts` (integration/unit for public API)
  - `modelClient.test.ts`, `sessionStore.test.ts` (unit)
- Add a `README.md` in the skills folder with API signatures and test examples.

### Process Spawning & API Injection
- Skills will run in a spawned process (e.g., Node.js child process or worker).
- The extension injects the API into the skill process at runtime (not via module exports).
- API injection can use IPC, context objects, or global registration.
- Skills access the API only through the injected interface, not by importing from the extension.

### Minimal API for Skills
Expose only essential methods to skills:
- `sendRequest(type: 'user' | 'assistant', model: string, content: string): Promise<Response>`
  - Sends a message to the LLM as either a user or assistant message.
- `selectChatModel(options): Promise<Model>`
  - Selects the chat model to use (e.g., Copilot, GPT-4o).
- Context management: (will be implemented by the next epic later)
  - `append(name: string, content: string)`: Appends content to a named context.
  - `get(name: string): string`: Retrieves the content of a named context.

### Security & Permissions
- Skills access the LLM API only through the extension’s controlled interface.
- Handle errors, rate limits, and user consent as described in VS Code documentation.
- Document the API for skill authors and provide utility functions for prompt building and context management.

### Rationale
- Keeps code minimal, modular, and testable.
- Mirrors parser structure: function-based, small files, types in-file, tests adjacent.
- Future-proofs for process isolation and secure API injection.
- Easy to extend for new skill features, agent workflows, or Copilot integration.

### Example layout
```text
packages/vscode-extension/src/skills/
  index.ts
  modelClient.ts
  sessionStore.ts
  errors.ts
  index.test.ts
  modelClient.test.ts
  sessionStore.test.ts
  README.md
```

### Notes
- Use pure functions and simple types (see parser and developing-guideline).
- Inject/mock dependencies in tests for isolation.
- Document public API and error contracts in README.
- Do not export API functions from `index.ts`; inject them into the skill process at runtime.
- Expand the API only as needed to support new skill features or workflows.

---

## Representative Code Examples

### Injecting the API into a Spawned Skill Process (Extension Side)
```typescript
// Extension code (simplified)
const skillProcess = spawn('node', ['mySkill.js']);
const api = {
  async selectChatModel(options) { /* ... */ },
  async sendRequest(type, model, content) { /* ... */ },
};
// Send API to skill process via IPC or context
skillProcess.send({ type: 'inject-api', api });
```

### Skill Script Example (mySkill.js)
```typescript
// Assume 'api' is injected and available in the skill process
async function runSkill() {
  // Select a model
  const model = await api.selectChatModel({ vendor: 'copilot', family: 'gpt-4o' });

  // Send a user prompt
  const response = await api.sendRequest('user', 'Summarize the latest research on hybrid search.');
}

runSkill().catch(err => {
  // Handle errors (timeout, provider error, invalid args)
  console.error('Skill error:', err);
});
```

### Error Handling Example
```typescript
try {
  const response = await api.sendRequest('user',''); // Empty prompt
} catch (err) {
  if (err.type === 'ValidationError') {
    // Handle invalid arguments
  } else if (err.type === 'TimeoutError') {
    // Handle timeout
  } else {
    // Handle other errors
  }
}
```

### Test Harness Example (in index.test.ts)
```typescript
// Test simulating skill usage
it('should select model and send request', async () => {
  await api.selectChatModel({ vendor: 'copilot', family: 'gpt-4o' });
  const response = await api.sendRequest('user', 'Hello!');
  expect(response.reply).toBeDefined();
});
```

---


