# Brainy Developing Guideline

## Principles

- Use a functions-based approach for all modules and features.
- Avoid using classes; prefer pure functions and composition.
- Use simple, effective TypeScript types. Prefer string literals and union types when possible.
- All TypeScript types must be defined inside the relevant code files, not in separate files.
- Test files should be placed next to their corresponding module files, not in a separate tests/ directory.
- Less code is better: keep implementations concise, modular, and focused.
- Code must be simple, straightforward, and easy to review and understand.
- All code must be documented. Use clear comments and JSDoc for public functions.
- At the beginning of every file, include a detailed explanation of how the module works and its purpose.
- After every story all tests have to pass.
- Before implementation read the existing code and structure and reflect the same patterns.
- Consistency is key.
- e2e tests take time, run only those you need. Use playwright MCP server tools.

## Module Patterns

### Singleton Pattern (Preferred)

Use singleton modules with module-level state for shared resources. Avoid factory functions when a singleton suffices.

**Pattern:**
```typescript
/**
 * Module: sessionStore.ts
 *
 * Description:
 *   Singleton in-memory session store for persisting selected model ID.
 *   Provides functions to get, set, and clear the selected model.
 *
 * Usage:
 *   import { getSelectedModel, setSelectedModel } from './sessionStore';
 *   setSelectedModel('gpt-4o');
 *   const modelId = getSelectedModel();
 */

/**
 * Singleton state for selected model ID.
 */
let selectedModel: string | undefined = undefined;

/**
 * Gets the currently selected model ID.
 */
export function getSelectedModel(): string | undefined {
	return selectedModel;
}

/**
 * Sets the selected model ID.
 */
export function setSelectedModel(modelId: string): void {
	selectedModel = modelId;
}

/**
 * Resets state. Used for testing.
 */
export function resetState(): void {
	selectedModel = undefined;
}
```

**Key Points:**
- Module-level state using `let` for mutable singleton state
- Export simple functions that operate on the state
- Always provide a `reset` function for test isolation
- No classes, no factory functions, no dependency injection containers

### Configuration Pattern

For configurable singletons, provide a `configure` function:

```typescript
/**
 * Singleton configuration state.
 */
let defaultTimeout = 8000;
let providerFn: ProviderFunction = defaultProvider;

/**
 * Configures the module singleton.
 */
export function configure(config: {
	defaultTimeout?: number;
	provider?: ProviderFunction;
}): void {
	if (config.defaultTimeout !== undefined) {
		defaultTimeout = config.defaultTimeout;
	}
	if (config.provider !== undefined) {
		providerFn = config.provider;
	}
}

/**
 * Resets configuration. Used for testing.
 */
export function resetConfig(): void {
	defaultTimeout = 8000;
	providerFn = defaultProvider;
}
```

## Error Handling

### Simple Error Re-throwing (Preferred)

Use plain `Error` objects. Preserve and rethrow errors to maintain stack traces and error types.

**Pattern:**
```typescript
/**
 * Sends a request with error handling.
 * 
 * @throws Error for validation, timeout, or provider failures
 */
export async function sendRequest(params: RequestParams): Promise<Response> {
	const timeoutMs = params.timeoutMs ?? defaultTimeoutMs;

	try {
		const response = await withTimeout(
			providerFn(params),
			timeoutMs,
			`Request timed out after ${timeoutMs}ms`
		);
		return response;
	} catch (error) {
		// Preserve and rethrow original errors
		if (error instanceof Error) {
			throw error;
		}
		throw new Error(String(error));
	}
}
```

**Key Points:**
- Use plain `Error` objects, not custom error classes
- Preserve original error instances when re-throwing
- Use descriptive error messages
- Let errors propagate naturally up the call stack
- Document what errors a function can throw using `@throws` JSDoc

### Validation Errors

Throw errors immediately for invalid input:

```typescript
export function selectModel(modelId: string): void {
	if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
		throw new Error('Model ID must be a non-empty string');
	}
	// ... rest of implementation
}
```

## Example File Header

```typescript
/**
 * Module: annotationParser.ts
 *
 * Description:
 *   Parses markdown files to extract annotation blocks, flags, and code sections.
 *   Uses regular expressions and pure functions. No classes or complex inheritance.
 *   All types are simple and use string literals where possible.
 *
 * Usage:
 *   Call parseAnnotations(markdown: string) to get structured annotation objects.
 */
```

## TypeScript Example

```typescript
type AnnotationType = 'task' | 'context' | 'model' | string;

interface Annotation {
	type: AnnotationType;
	flags: Record<string, string>;
	content: string;
}

/**
 * Parses markdown and returns an array of annotations.
 */
export function parseAnnotations(markdown: string): Annotation[] {
	// ...implementation...
}
```

## Testing Patterns

### Test Structure

```typescript
/**
 * Unit tests for session store.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { getModel, setModel, resetState } from './sessionStore';

describe('sessionStore', () => {
	beforeEach(() => {
		// Reset singleton state before each test
		resetState();
	});

	test('sets and gets model', () => {
		setModel('gpt-4o');
		expect(getModel()).toBe('gpt-4o');
	});

	test('throws error for invalid input', () => {
		expect(() => setModel('')).toThrow('must be a non-empty string');
	});
});
```

**Key Points:**
- Use `beforeEach` to reset singleton state
- Test one behavior per test case
- Use descriptive test names
- Test both success and error cases
- Use `expect().toThrow()` for error validation

### Mock Configuration

For testing you can use mock, but try to avoid them. Pure functions approach testing with input/output is prefered. For mocking use the configuration pattern:

```typescript
import { vi } from 'vitest';

test('uses custom provider', async () => {
	const mockProvider = vi.fn(async (params) => ({
		reply: `Mock: ${params.content}`,
		raw: {}
	}));

	configure({ provider: mockProvider });
	
	const response = await sendRequest({ content: 'test' });
	
	expect(mockProvider).toHaveBeenCalledWith(
		expect.objectContaining({ content: 'test' })
	);
	expect(response.reply).toBe('Mock: test');
});
```

## Function Organization

### Public API Functions

Export main functionality directly:

```typescript
// ✅ Good: Direct export of singleton API
export function selectModel(id: string): void { ... }
export function sendRequest(role: string, content: string): Promise<Response> { ... }

// ❌ Avoid: Factory functions unless necessary
export function createAPI() { 
	return { 
		selectModel: ..., 
		sendRequest: ... 
	};
}
```

### Helper Functions

Keep helper functions private (not exported) unless they're genuinely reusable:

```typescript
// Private helper - not exported
function withTimeout<T>(promise: Promise<T>, ms: number, msg: string): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(msg)), ms);
		promise
			.then((result) => { clearTimeout(timer); resolve(result); })
			.catch((error) => { clearTimeout(timer); reject(error); });
	});
}

// Public API - exported
export async function sendRequest(params: RequestParams): Promise<Response> {
	return await withTimeout(provider(params), params.timeout, 'Timeout');
}
```

## Type Definitions

### Inline Types (Preferred)

Define types in the same file where they're used:

```typescript
/**
 * Request parameters for sending a message.
 */
export type SendRequestParams = {
	/** Model ID to use */
	modelId: string;
	/** Message role */
	role: 'user' | 'assistant';
	/** Message content */
	content: string;
	/** Optional timeout override */
	timeoutMs?: number;
};
```

### Type Re-exports

Re-export types from index files for convenience:

```typescript
// Re-export types for convenience
export type { ModelResponse, SendRequestParams } from './modelClient';
export type { Flag } from './blocks/flag';
```

## Documentation Standards

### JSDoc Format

```typescript
/**
 * Brief one-line description of what the function does.
 *
 * Optional longer description with more details about behavior,
 * edge cases, or important implementation notes.
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Description of optional parameter (optional)
 * @returns Description of return value
 * @throws Error description of when/why errors are thrown
 */
export function exampleFunction(paramName: string, optionalParam?: number): ReturnType {
	// implementation
}
```

### Module Header

Every file must start with:
```typescript
/**
 * Module: path/to/module.ts
 *
 * Description:
 *   Detailed explanation of the module's purpose, what it does,
 *   and how it fits into the larger system.
 *
 * Usage:
 *   Example code showing how to import and use the module.
 */
```