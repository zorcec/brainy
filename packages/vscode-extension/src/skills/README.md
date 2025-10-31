# Skills System API

A minimal, testable skills API for VS Code extension authors. This module provides factory functions for creating isolated API instances with model selection and LLM request capabilities.

> **⚠️ Maintainer Note**: This module follows the parser's function-based, test-adjacent style. Use pure functions, avoid classes, and keep implementations modular and focused.

## Overview

The skills system provides a simple API for interacting with language models in the Brainy VS Code extension. It follows a factory-based pattern for dependency injection and testing, with explicit error handling and timeout support.

## Module Structure

```
skills/
├── index.ts                    # Main entry point, API factory
├── index.test.ts               # API integration tests
├── modelClient.ts              # Provider calls, timeout & error handling
├── modelClient.test.ts         # Model client tests
├── sessionStore.ts             # In-memory model selection persistence
├── sessionStore.test.ts        # Session store tests
├── errors.ts                   # Typed error constructors
├── errors.test.ts              # Error handling tests
└── README.md                   # This file
```

## API Contract

### Factory Function

```typescript
function createSkillsAPI(config?: SkillsAPIConfig): SkillsAPI
```

Creates a new skills API instance with injected dependencies.

**Config Options:**
- `defaultModelId?: string` - Default model to use when none is selected
- `defaultTimeoutMs?: number` - Default timeout in milliseconds (default: 8000)
- `sessionStore?: SessionStore` - Custom session store for testing
- `modelClient?: ModelClient` - Custom model client for testing

### Public API

```typescript
type SkillsAPI = {
  selectChatModel: (modelId: string) => void;
  sendRequest: (
    role: 'user' | 'assistant',
    content: string,
    opts?: { timeoutMs?: number }
  ) => Promise<ModelResponse>;
};
```

#### `selectChatModel(modelId: string): void`

Selects the chat model to use for subsequent requests.

**Parameters:**
- `modelId` - Model identifier (e.g., 'gpt-4o', 'claude-3')

**Throws:**
- `Error` if modelId is empty, whitespace-only, or not a string

**Example:**
```typescript
const api = createSkillsAPI();
api.selectChatModel('gpt-4o');
```

#### `sendRequest(role, content, opts?): Promise<ModelResponse>`

Sends a request to the selected (or default) model.

**Parameters:**
- `role` - Message role: 'user' or 'assistant'
- `content` - Message content (non-empty string)
- `opts.timeoutMs` - Optional timeout override in milliseconds

**Returns:**
```typescript
type ModelResponse = {
  reply: string;      // Normalized response text
  raw: unknown;       // Raw provider response
};
```

**Throws:**
- `Error` - For all error conditions including:
  - Invalid role or empty content
  - No model selected and no default configured
  - Request timeout
  - LLM provider errors
  - Network-related errors

**Example:**
```typescript
const api = createSkillsAPI({ defaultModelId: 'gpt-4o' });
const response = await api.sendRequest('user', 'Hello!', { timeoutMs: 5000 });
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
import { createSkillsAPI } from './skills';

// Create API with default model
const api = createSkillsAPI({ defaultModelId: 'gpt-4o' });

// Send a request
const response = await api.sendRequest('user', 'Summarize this document');
console.log(response.reply);
```

### Model Selection

```typescript
const api = createSkillsAPI();

// Select a model
api.selectChatModel('gpt-4o');

// Send request to selected model
const response = await api.sendRequest('user', 'Hello!');

// Switch models
api.selectChatModel('claude-3');
const response2 = await api.sendRequest('user', 'Same question, different model');
```

### Skills Can Override Model (Internal API)

Skills have access to the lower-level `modelClient.sendRequest` which accepts an optional `modelId` parameter. This allows individual skills to override the globally selected model:

```typescript
// Inside a skill implementation
import { sendRequest as clientSendRequest } from './modelClient';

// Skill uses the global model (via index.ts)
const response1 = await api.sendRequest('user', 'Hello!');

// Or skill can call modelClient directly to override the model
const response2 = await clientSendRequest({
  modelId: 'skill-specific-model', // Override for this request only
  role: 'user',
  content: 'Hello with specific model!'
});
```

**Architecture:**
- `@model` skill or `selectChatModel()` sets the **global default model** for all skills
- High-level API (`index.ts sendRequest`) uses the globally selected/default model
- Skills can import `modelClient.sendRequest` directly to override the model per-request
- This allows flexible per-skill model selection while maintaining a global default

### Error Handling

```typescript
const api = createSkillsAPI({ defaultModelId: 'gpt-4o' });

try {
  const response = await api.sendRequest('user', 'My question', { timeoutMs: 3000 });
  console.log(response.reply);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('must be')) {
      console.error('Validation error:', error.message);
    } else if (error.message.includes('timed out')) {
      console.error('Request timed out');
    } else if (error.message.includes('Provider error')) {
      console.error('Provider error:', error.message);
    } else if (error.message.includes('Network error')) {
      console.error('Network error:', error.message);
    }
  }
}
```

### Testing with Mocks

```typescript
import { createSkillsAPI } from './skills';
import { createModelClient } from './modelClient';

// Create mock provider
const mockProvider = async (params) => ({
  reply: `Mock response to: ${params.content}`,
  raw: { model: params.modelId }
});

// Inject mock into API
const api = createSkillsAPI({
  modelClient: createModelClient({ provider: mockProvider })
});

// Test with mock
api.selectChatModel('test-model');
const response = await api.sendRequest('user', 'Test message');
expect(response.reply).toBe('Mock response to: Test message');
```

## Test Harness Example

The test suite includes comprehensive test harnesses that demonstrate API usage patterns:

```typescript
// Complete workflow test
const api = createSkillsAPI({
  modelClient: createModelClient({ provider: mockProvider })
});

// Select model
api.selectChatModel('gpt-4o');

// Send multiple requests
const response1 = await api.sendRequest('user', 'First message');
const response2 = await api.sendRequest('assistant', 'Previous response');
const response3 = await api.sendRequest('user', 'Follow-up question');

// Switch models
api.selectChatModel('claude-3');
const response4 = await api.sendRequest('user', 'New model request');
```

## Design Principles

- **Function-based**: Use pure functions and factory patterns, avoid classes
- **Dependency Injection**: All dependencies are injected for easy testing
- **Explicit Errors**: Typed errors with context for debugging
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

- [index.ts](./index.ts) - API factory and public interface
- [modelClient.ts](./modelClient.ts) - Model client implementation
- [sessionStore.ts](./sessionStore.ts) - Session persistence
- [errors.ts](./errors.ts) - Error types and constructors

## Test Files

- [index.test.ts](./index.test.ts) - API integration tests (16 tests)
- [modelClient.test.ts](./modelClient.test.ts) - Model client tests (11 tests)
- [sessionStore.test.ts](./sessionStore.test.ts) - Session store tests (6 tests)
- [errors.test.ts](./errors.test.ts) - Error handling tests (3 tests)

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
