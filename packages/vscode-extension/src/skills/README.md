# Skills System API

A minimal, testable skills API for VS Code extension authors. This module provides singleton functions for model selection and LLM request handling.

> **⚠️ Maintainer Note**: This module follows the parser's function-based, test-adjacent style. Use pure functions, avoid classes, and keep implementations modular and focused.

## Overview

The skills system provides a simple API for interacting with language models in the Brainy VS Code extension. It follows a singleton pattern with configuration-based dependency injection for testing, with explicit error handling and timeout support.

## Module Structure

```
skills/
├── index.ts                    # Public API singleton exports
├── index.test.ts               # API integration tests
├── modelClient.ts              # Provider calls, timeout & error handling
├── modelClient.test.ts         # Model client tests
├── sessionStore.ts             # In-memory model selection persistence
├── sessionStore.test.ts        # Session store tests
└── README.md                   # This file
```

## API Contract

The skills system provides a singleton API with direct function exports. All functions operate on module-level state and use dependency injection through configuration functions for testing.

### Public API

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

### Types

```typescript
type ModelResponse = {
  reply: string;      // Normalized response text
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

## Test Files

- [index.test.ts](./index.test.ts) - API integration tests (20 tests)
- [modelClient.test.ts](./modelClient.test.ts) - Model client tests (15 tests)
- [sessionStore.test.ts](./sessionStore.test.ts) - Session store tests (6 tests)

**Total: 41 tests, all passing**

## Future Extensions

This minimal API is designed for extension. Future versions may include:
- Context management APIs (`append`, `get`)
- Additional model selection options
- Streaming responses
- Multi-turn conversation support
- Skill execution runtime

## References

- [Project Overview](../../../information/project/overview.md)
- [Skills System Epic](../../../information/tickets/003-skills-system/epic.md)
- [Parser Module](../parser/README.md) - Similar module structure and style
- [Developing Guideline](../../../../developing-guideline.md)
