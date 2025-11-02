# Skills System API

A minimal, testable skills API for Brainy extension. This module provides:
- Skill definition API (Skill interface with name, description, execute)
- Built-in skills (shipped with extension) and project skills (.brainy/skills)
- Skill loading and execution
- Model selection and LLM request handling

> **⚠️ Maintainer Note**: This module follows the parser's function-based, test-adjacent style. Use pure functions, avoid classes, and keep implementations modular and focused.

## Overview

The skills system provides a modular API for defining and executing skills in Brainy playbooks. Skills are async functions that can be invoked from markdown annotations and return string results.

## Module Structure

```
skills/
├── index.ts                    # Public API singleton exports
├── index.test.ts               # API integration tests
├── types.ts                    # Core types (Skill, SkillParams)
├── skillLoader.ts              # Skill loading and execution
├── skillLoader.test.ts         # Skill loader tests
├── skillScanner.ts             # Skill scanning and registry
├── skillScanner.test.ts        # Skill scanner tests (if exists)
├── built-in/                   # Built-in skills directory
│   ├── index.ts                # Built-in skills registry
│   ├── file.ts                 # File manipulation skill
│   └── file.test.ts            # File skill tests
├── modelClient.ts              # Provider calls, timeout & error handling
├── modelClient.test.ts         # Model client tests
├── sessionStore.ts             # In-memory model selection persistence
├── sessionStore.test.ts        # Session store tests
├── skillRunner.ts              # Legacy skill runner (to be deprecated)
├── skillRunner.test.ts         # Legacy skill runner tests
└── README.md                   # This file
```

## Skill API

### Skill Interface

All skills must implement the `Skill` interface:

```typescript
export interface Skill {
  name: string;           // Unique skill identifier
  description: string;    // Brief description for tooltips/docs
  execute(params: SkillParams): Promise<string>;  // Async execution function
}

export type SkillParams = Record<string, string | undefined>;
```

### Example: File Skill

```typescript
// skills/built-in/file.ts
import { Skill, SkillParams } from '../types';

export const fileSkill: Skill = {
  name: 'file',
  description: 'Read, write and delete files.',
  
  async execute(params: SkillParams): Promise<string> {
    const { action, path, content } = params;
    
    // Validate parameters
    if (!action) throw new Error('Missing required parameter: action');
    if (!path) throw new Error('Missing required parameter: path');
    
    // Execute action
    switch (action) {
      case 'read':
        return await readFile(path);
      case 'write':
        if (!content) throw new Error('Missing content for write');
        return await writeFile(path, content);
      case 'delete':
        return await deleteFile(path);
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  }
};
```

### Usage in Playbooks

Skills are invoked using annotations with flags:

```markdown
@file --action "read" --path "./notes.md"
@file --action "write" --path "./output.txt" --content "hello world"
@file --action "delete" --path "./temp.txt"
```

Flags are translated into `SkillParams`:
- `@file --action "read" --path "./notes.md"` → `{ action: "read", path: "./notes.md" }`

## Built-in Skills

Built-in skills are shipped with the extension and always available:

### File Skill

**Name:** `file`

**Description:** Read, write and delete files.

**Parameters:**
- `action`: "read" | "write" | "delete" (required)
- `path`: File path, relative to workspace or absolute (required)
- `content`: File content (required for write action)

**Examples:**
```markdown
@file --action "read" --path "./config.json"
@file --action "write" --path "./output.txt" --content "Hello, World!"
@file --action "delete" --path "./temp.log"
```

## Project Skills

Project skills are loaded from `.brainy/skills/` directory in the workspace. They can be `.js` or `.ts` files.

**Convention:**
```
your-workspace/
└── .brainy/
    └── skills/
        ├── custom.ts      # Custom TypeScript skill
        ├── task.js        # Custom JavaScript skill
        └── context.js     # Another custom skill
```

**Priority:** Built-in skills always take priority. If a project skill has the same name as a built-in skill, the built-in skill will be used and a warning will be logged.

## API Functions

```typescript
// Main API functions
export function selectChatModel(modelId: string): void;

export async function sendRequest(
  role: 'user' | 'assistant',
  content: string,
  opts?: { timeoutMs?: number }
): Promise<ModelResponse>;

// Configuration and testing utilities
export function resetSkills(): void;
```

## API Functions

### Skill Loading and Execution

```typescript
// Load a skill by name (checks built-in first, then project skills)
export async function loadSkill(
  skillName: string,
  workspaceUri?: vscode.Uri
): Promise<Skill>;

// Execute a loaded skill
export async function executeSkill(
  skill: Skill,
  params: SkillParams
): Promise<string>;

// Load and execute in one call (convenience function)
export async function runSkill(
  skillName: string,
  params: SkillParams,
  workspaceUri?: vscode.Uri
): Promise<string>;
```

### Skill Scanning

```typescript
// Get all available skill names (built-in + project)
export function getAvailableSkills(): string[];

// Refresh skills list from workspace
export async function refreshSkills(workspaceUri: vscode.Uri): Promise<string[]>;

// Check if a skill is available
export function isSkillAvailable(skillName: string): boolean;

// Get project-specific skills only
export function getProjectSkills(): string[];
```

### Built-in Skills Registry

```typescript
// Get all built-in skills
export function getBuiltInSkills(): Map<string, Skill>;

// Get a specific built-in skill
export function getBuiltInSkill(name: string): Skill | undefined;

// Check if a skill name is built-in
export function isBuiltInSkill(name: string): boolean;

// Get all built-in skill names
export function getBuiltInSkillNames(): string[];
```

### Model Selection and LLM Requests

```typescript
// Select the chat model to use
export function selectChatModel(modelId: string): void;

// Send a request to the selected model
export async function sendRequest(
  role: 'user' | 'assistant',
  content: string,
  opts?: { timeoutMs?: number }
): Promise<ModelResponse>;
```

### Types

```typescript
// Skill types
export interface Skill {
  name: string;
  description: string;
  execute(params: SkillParams): Promise<string>;
}

export type SkillParams = Record<string, string | undefined>;

// Model types
type ModelResponse = {
  reply: string;      // Normalized response text
  raw: unknown;       // Raw provider response
};
```

## Creating Custom Skills

Custom skills can be created in your project's `.brainy/skills` directory. Both JavaScript and TypeScript files are supported.

### Step-by-Step Guide

1. **Create the `.brainy/skills` directory** in your workspace root if it doesn't exist.

2. **Create a skill file** (e.g., `custom.ts` or `custom.js`).

3. **Export a Skill object** with name, description, and execute function:

```typescript
// .brainy/skills/custom.ts
import { Skill, SkillParams } from '@brainy/skills/types';

export const customSkill: Skill = {
  name: 'custom',
  description: 'My custom skill that does something useful',
  
  async execute(params: SkillParams): Promise<string> {
    const { param1, param2 } = params;
    
    // Your implementation logic here
    // Validate parameters
    if (!param1) throw new Error('Missing required parameter: param1');
    
    // Do something useful
    const result = `Processed: ${param1} and ${param2}`;
    
    // Return string result
    return result;
  }
};
```

4. **Use the skill in your playbook:**

```markdown
@custom --param1 "value1" --param2 "value2"
```

### Best Practices

- **Name:** Use lowercase, hyphen-separated names (e.g., `my-skill`). The name should match the filename.
- **Description:** Keep it concise (one line). Used for tooltips and documentation.
- **Parameters:** Validate all required parameters at the start of execute().
- **Errors:** Throw descriptive errors. They will be shown in the UI tooltip.
- **Return value:** Always return a string. Use JSON.stringify() for complex data.
- **Async:** All skills are async. Use await for async operations.
- **Side effects:** Skills can have side effects (file I/O, network calls, etc.).

### Example: HTTP Request Skill

```typescript
// .brainy/skills/http.ts
import { Skill, SkillParams } from '@brainy/skills/types';

export const httpSkill: Skill = {
  name: 'http',
  description: 'Make HTTP requests',
  
  async execute(params: SkillParams): Promise<string> {
    const { method = 'GET', url, body } = params;
    
    if (!url) throw new Error('Missing required parameter: url');
    
    const response = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  }
};
```

### Types (Expanded)
  raw: unknown;       // Raw provider response
};
```

### `selectChatModel(modelId: string): void`

Selects the chat model to use for subsequent requests. The selection is persisted in module-level state.

**Parameters:**
- `modelId` - Model identifier (e.g., 'gpt-4o', 'claude-3')

**Throws:**
- `Error` if modelId is empty, whitespace-only, or not a string

**Example:**
```typescript
import { selectChatModel } from './skills';

selectChatModel('gpt-4o');
```

### `sendRequest(role, content, opts?): Promise<ModelResponse>`

Sends a request to the selected (or default) model. Uses a hardcoded default model ('gpt-4.1') if no model has been selected.

**Parameters:**
- `role` - Message role: 'user' or 'assistant'
- `content` - Message content (non-empty string)
- `opts.timeoutMs` - Optional timeout override in milliseconds (default: 8000ms)

**Returns:**
```typescript
type ModelResponse = {
  reply: string;      // Normalized response text
  raw: unknown;       // Raw provider response
};
```

**Throws:**
- `Error` - For all error conditions including:
  - Invalid role (must be 'user' or 'assistant')
  - Empty or whitespace-only content
  - Request timeout (after specified timeout)
  - LLM provider errors
  - Network-related errors

**Example:**
```typescript
import { selectChatModel, sendRequest } from './skills';

selectChatModel('gpt-4o');
const response = await sendRequest('user', 'Hello!', { timeoutMs: 5000 });
console.log(response.reply);
```

## Error Handling

The skills system uses standard JavaScript `Error` objects for simplicity. Error messages include context and are designed to be descriptive.

**Error message patterns:**
- Validation errors: `"Model ID must be a non-empty string"`, `"Content must be a non-empty string"`
- Timeout errors: `"Request timed out after {ms}ms"`
- Provider errors: `"Provider error: {original message}"`
- Network errors: `"Network error: {original message}"`

**Checking error types:**
```typescript
try {
  await api.sendRequest('user', 'Hello!', { timeoutMs: 3000 });
} catch (error) {
  if (error.message.includes('timed out')) {
    console.error('Request timed out');
  } else if (error.message.includes('Provider error')) {
    console.error('Provider failed');
  } else if (error.message.includes('Network error')) {
    console.error('Network issue');
  } else if (error.message.includes('must be')) {
    console.error('Validation error');
  }
}
```

## Usage Examples

### Basic Usage

```typescript
import { selectChatModel, sendRequest } from './skills';

// Select a model
selectChatModel('gpt-4o');

// Send a request
const response = await sendRequest('user', 'Summarize this document');
console.log(response.reply);
```

### Model Selection

```typescript
import { selectChatModel, sendRequest } from './skills';

// Select a model
selectChatModel('gpt-4o');

// Send request to selected model
const response = await sendRequest('user', 'Hello!');

// Switch models
selectChatModel('claude-3');
const response2 = await sendRequest('user', 'Same question, different model');
```

### Using Default Model

```typescript
import { sendRequest } from './skills';

// Use hardcoded default model ('gpt-4.1') without selecting
const response = await sendRequest('user', 'Hello!');
console.log(response.reply);
```

### Skills Can Override Model (Internal API)

Skills have access to the lower-level `modelClient.sendRequest` which accepts an optional `modelId` parameter. This allows individual skills to override the globally selected model:

```typescript
// Inside a skill implementation
import { sendRequest } from './skills';
import { sendRequest as clientSendRequest } from './modelClient';

// Skill uses the global model
const response1 = await sendRequest('user', 'Hello!');

// Or skill can call modelClient directly to override the model
const response2 = await clientSendRequest({
  modelId: 'skill-specific-model', // Override for this request only
  role: 'user',
  content: 'Hello with specific model!'
});
```

**Architecture:**
- `selectChatModel()` sets the **global default model** for all skills
- High-level API (`sendRequest`) uses the globally selected/default model
- Skills can import `modelClient.sendRequest` directly to override the model per-request
- This allows flexible per-skill model selection while maintaining a global default

### Error Handling

```typescript
import { selectChatModel, sendRequest } from './skills';

selectChatModel('gpt-4o');

try {
  const response = await sendRequest('user', 'My question', { timeoutMs: 3000 });
  console.log(response.reply);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('must be')) {
      console.error('Validation error:', error.message);
    } else if (error.message.includes('timed out')) {
      console.error('Request timed out');
    } else {
      console.error('Provider or network error:', error.message);
    }
  }
}
```

### Testing with Mocks

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { selectChatModel, sendRequest, resetSkills } from './skills';
import { configureModelClient } from './modelClient';

describe('skills API tests', () => {
  beforeEach(() => {
    // Reset singleton state before each test
    resetSkills();
  });

  test('uses mock provider', async () => {
    // Create and configure mock provider
    const mockProvider = vi.fn(async (params) => ({
      reply: `Mock response to: ${params.content}`,
      raw: { model: params.modelId }
    }));

    configureModelClient({ provider: mockProvider });

    // Test with mock
    selectChatModel('test-model');
    const response = await sendRequest('user', 'Test message');
    
    expect(response.reply).toBe('Mock response to: Test message');
    expect(mockProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: 'test-model',
        role: 'user',
        content: 'Test message'
      })
    );
  });
});
```

## Test Harness Example

The test suite includes comprehensive test harnesses that demonstrate API usage patterns. Here's an integration test example from `index.test.ts`:

```typescript
import { selectChatModel, sendRequest, resetSkills } from './skills';
import { configureModelClient } from './modelClient';

// Setup mock provider
const mockProvider = vi.fn(async (params) => ({
  reply: `Response from ${params.modelId}`,
  raw: {}
}));

configureModelClient({ provider: mockProvider });

// Complete workflow test
beforeEach(() => resetSkills());

test('complete workflow: select model and send multiple requests', async () => {
  // Select model
  selectChatModel('gpt-4o');

  // Send multiple requests
  const response1 = await sendRequest('user', 'First message');
  const response2 = await sendRequest('assistant', 'Previous response');
  const response3 = await sendRequest('user', 'Follow-up question');

  // Switch models
  selectChatModel('claude-3');
  const response4 = await sendRequest('user', 'New model request');

  expect(mockProvider).toHaveBeenCalledTimes(4);
});
```

## Design Principles

- **Function-based**: Use pure functions and singleton pattern, avoid classes
- **Dependency Injection**: Dependencies injected via configuration functions for testing
- **Explicit Errors**: Plain Error objects with descriptive messages
- **Test-adjacent**: Tests are next to implementation files
- **Minimal API**: Only essential functionality, extensible for future needs

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests for specific module
npm test -- skills/index.test.ts
```

## Module Files

- [index.ts](./index.ts) - Public API and singleton exports
- [modelClient.ts](./modelClient.ts) - Model client implementation with timeout and error handling
- [sessionStore.ts](./sessionStore.ts) - Session persistence for selected model
- [skillRunner.ts](./skillRunner.ts) - Skill module loader and executor (supports .js and .ts files)

## Test Files

- [index.test.ts](./index.test.ts) - API integration tests (20 tests)
- [modelClient.test.ts](./modelClient.test.ts) - Model client tests (15 tests)
- [sessionStore.test.ts](./sessionStore.test.ts) - Session store tests (6 tests)
- [skillRunner.test.ts](./skillRunner.test.ts) - Skill runner tests (19 tests)

**Total: 60 tests, all passing**

---

## Skill Runner

The skill runner module provides functionality for loading and executing skill files (both JavaScript and TypeScript). Skills are modular functions that can be invoked from playbooks or other parts of the extension.

### Skill Structure

Skills must export an object with a `run(api, params)` async function:

**JavaScript Skill:**
```javascript
// skills/basic.js
module.exports = {
  async run(api, params) {
    return {
      exitCode: 0,      // 0 = success, non-zero = failure
      stdout: 'hello world',
      stderr: ''
    };
  }
};
```

**TypeScript Skill:**
```typescript
// skills/execute.ts
export async function run(api: any, params: any): Promise<SkillResult> {
  return {
    exitCode: 0,
    stdout: 'hello world',
    stderr: ''
  };
}
```

### Skill Runner API

```typescript
// Load a skill module (supports .js and .ts)
const skill = await loadSkill('/path/to/skill.js');

// Execute a loaded skill
const result = await executeSkill(skill, api, params);

// Load and execute in one call
const result = await runSkill('/path/to/skill.js', api, params);
```

### TypeScript Support

The skill runner automatically detects `.ts` files and uses `ts-node` for on-the-fly transpilation. No manual compilation required.

### Result Structure

All skills must return a `SkillResult` object:

```typescript
interface SkillResult {
  exitCode: number;   // 0 for success, non-zero for failure
  stdout: string;     // Standard output
  stderr: string;     // Standard error
}
```

### Example Skills

- JavaScript: `packages/vscode-extension/e2e/test-project/.brainy/skills/basic.js`
- TypeScript: `packages/vscode-extension/e2e/test-project/.brainy/skills/execute.ts`

### Error Handling

The skill runner validates:
- Skill path is non-empty string
- Skill file exists
- Skill exports a `run` function
- Result has correct structure (exitCode, stdout, stderr)

All errors are caught and wrapped with descriptive messages.

---

## Future Extensions

This minimal API is designed for extension. Future versions may include:
- Context management APIs (`append`, `get`)
- Additional model selection options
- Streaming responses
- Multi-turn conversation support
- Process isolation for skills
- Timeout configuration for skills
- Resource limits (memory, CPU)

## References

- [Project Overview](../../../information/project/overview.md)
- [Skills System Epic](../../../information/tickets/003-skills-system/epic.md)
- [Parser Module](../parser/README.md) - Similar module structure and style
- [Playbook Execution Engine Epic](../../../information/tickets/006-playbook-execution-engine/epic.md)
- [Developing Guideline](../../../../developing-guideline.md)
