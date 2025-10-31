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