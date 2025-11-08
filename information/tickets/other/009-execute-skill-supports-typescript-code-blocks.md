## Title
Execute skill supports TypeScript code block execution

## Problem
The execute skill does not support running TypeScript code blocks. Code block content must be transpiled and evaluated inside the extension, but this is not currently possible.

## Solution
Enable the execute skill to accept TypeScript code blocks, transpile them, and safely evaluate the result inside the extension. Cover this feature with tests.

## Acceptance Criteria
- All tests are passing.
- Execute skill can run TypeScript code blocks.
- Code is transpiled and evaluated securely.
- Feature is tested with various code block scenarios.

## Tasks/Subtasks
- [ ] Integrate TypeScript transpilation into execute skill.
- [ ] Implement secure evaluation of transpiled code.
- [ ] Write tests for TypeScript code block execution.

## Open Questions
- <PLACEHOLDER: What security measures are needed for eval?>
- <PLACEHOLDER: Should error handling be surfaced to the user?>

## Additional Info & References
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Accept TypeScript code blocks in execute skill.
- Transpile code using a TypeScript compiler.
- Evaluate transpiled code and return results.

### Implementation Reflection
- There are two main approaches for executing TypeScript code blocks:
	1. Write code to a temp file and run with `ts-node` (current method).
	2. Transpile TypeScript code in-memory and evaluate it in-process (recommended, as used for local skills).
- Reusing the skill transpilation and evaluation logic avoids temp files and external processes, and is consistent with how local skills are handled.
- For security, in-process evaluation should be sandboxed or restricted if running untrusted code.
- The recommended approach is to use `transpileSkill` and an in-process wrapper for TypeScript code blocks, unless there is a strong reason to use temp files and `ts-node`.

### Reuse of Skill Transpilation & Execution Logic
- Local skills are transpiled from TypeScript to JavaScript using `transpileSkill` and executed in-process via a wrapper and `eval`.
- For TypeScript code blocks, you can reuse this logic:

```typescript
import { transpileSkill } from './skills/transpiler';

// Transpile TypeScript code block to JavaScript
const jsCode = transpileSkill(tsCode);

// Evaluate the code block (sandboxing recommended for untrusted code)
const module: any = { exports: {} };
const exports = module.exports;
const wrappedCode = `(function(module, exports) { ${jsCode} })`;
const fn = eval(wrappedCode);
fn(module, exports);

// Use module.exports or exports as needed
```

- This avoids temp files and external processes, and is consistent with local skill handling.
- For security, consider sandboxing or restricting available APIs during evaluation.

### Challenge Reflection & Answers
- What security measures should be implemented when evaluating transpiled TypeScript code in-process?
	- None.
- Should the evaluation environment restrict access to Node.js APIs or global objects?
	- No.
- How will you handle errors and exceptions from user code blocks—should all errors be surfaced to the user, or should some be filtered?
	- Yes, all errors are surfaced. The execute skill is red (same as validation error); on hover, the full stack is shown.
- Is there a need to support asynchronous code blocks, or only synchronous execution?
	- Async support is needed; inside the snippet, we should be able to use `await`.
- How will you prevent infinite loops or resource exhaustion in user code?
	- We won't.
- Should there be a limit on the size or complexity of code blocks that can be executed?
	- No.
- How will you test and validate the sandboxing and error handling mechanisms?
	- Test with e2e tests and simple tests to see what is possible.
- Are there any compatibility concerns with different TypeScript versions or features?
	- No.