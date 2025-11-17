
## Problem
The execute skill fails if a code block is not immediately after the @execute annotation, resulting in a runtime error instead of a real-time validation error. The current implementation does not support assigning the value of a return statement in the code block to the specified variable. There is no e2e test for JS execution with a return statement.

## Solution
Update the execute skill logic to:
- Correctly recognize and execute the code block following the @execute annotation.
- Provide real-time validation error in the editor if the code block is missing, preventing runtime errors.
- Support return statements in the code block and assign their values to the specified variable.
- Add an e2e test covering JS execution with a return statement.

## Acceptance Criteria
- All unit and e2e tests are passing.
- Code block after @execute is recognized and executed.
- Real-time validation error is shown if code block is missing.
- Return statement value is assigned to the specified variable.
- e2e test verifies JS execution with return statement.

## Additional Info & References
- Risks: Validation may not catch all edge cases; return value assignment may fail for complex code blocks.
- Testability: Add comprehensive tests and error handling.
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Important code changes

Relevant code to adapt is in the playbook execution logic, especially in `execute.ts` and related test files. The following summarizes the required logic and validation:

```typescript
// Core logic for execute skill
const nextBlock = blocks[currentIndex + 1];
if (!nextBlock || nextBlock.name !== 'plainCodeBlock') {
    throw new Error('No code block found after execute skill. Ensure there is a code block immediately following the @execute annotation.');
}
const language = nextBlock.metadata?.language;
if (!language) throw new Error('Code block is missing language metadata.');
const code = nextBlock.content;
if (!code || code.trim() === '') throw new Error('Code block is empty.');
const executor = LANGUAGE_EXECUTORS[language.toLowerCase()];
if (!executor) throw new Error(`Unsupported language: ${language}.`);
// For JS/TS, support return statement and assign value to variable
if (language === 'javascript' || language === 'typescript') {
    const wrappedCode = `(function() { ${code} })()`;
    const result = eval(wrappedCode); // Use a safer sandbox in production
    if (params.variable) api.setVariable(params.variable, result);
}
// For other languages, execute and assign output
else {
    const output = executeCode(code, executor.command, executor.extension);
    if (params.variable) api.setVariable(params.variable, output);
}
```

## Test use-case examples


### Test use-case examples
1. **Code block immediately after @execute (JS/TS):**
        ```markdown
        @execute --variable "test"
        ```typescript
        return 'g'
        ```
        // Expected: variable 'test' is set to 'g'
        ```
2. **Missing code block after @execute:**
        ```markdown
        @execute --variable "test"
        // Expected: real-time validation error shown in editor (not just runtime)
        ```
3. **Invalid JS code in code block:**
        ```markdown
        @execute --variable "test"
        ```typescript
        return
        ```
        // Expected: error handled gracefully, variable not set

// Example unit test:
it('assigns return value to variable for JS', async () => {
    const blocks = [
        { name: 'execute', flags: [], content: '@execute --variable "test"', line: 1 },
        { name: 'plainCodeBlock', flags: [], content: 'return 42', line: 2, metadata: { language: 'javascript' } }
    ];
    mockApi.getParsedBlocks = () => blocks;
    mockApi.getCurrentBlockIndex = () => 0;
    await executeSkill.execute(mockApi, { variable: 'test' });
    expect(mockApi.getVariable('test')).toBe(42);
});

// e2e test should cover:
- Real JS/TS execution with return statement and variable assignment
- Validation error for missing code block (editor and runtime)
- Graceful handling of JS errors