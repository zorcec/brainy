
## Title
Skills System Module Structure Setup

## Context
Brainy needs a minimal, testable skills API for VS Code extension authors. The module must follow the parser’s function-based, test-adjacent style and support future agent workflows.

## Goal
Create the initial skills system module structure in `packages/vscode-extension/src/skills/` with all required files, ready for API and test implementation. Files should be TypeScript (.ts) with tests written for Vitest and placed adjacent to implementation (test-adjacent style).

## Implementation Plan
- Create the following TypeScript files under `packages/vscode-extension/src/skills/`:
	- `index.ts` (module entry / API injection factory)
	- `modelClient.ts` (provider calls, timeout and error normalization)
	- `sessionStore.ts` (in-memory/session persistence for selected model)
	- `errors.ts` (typed error constructors / shapes)
- Add adjacent test files following Vitest conventions:
	- `index.test.ts`, `modelClient.test.ts`, `sessionStore.test.ts`
- Add a `README.md` documenting API signatures, behavior, and test harness examples
- Implement code as pure functions where possible and prefer factory functions to enable injection/mocking in tests

## Edge Cases & Testing
- Confirm TypeScript files compile with package tsconfig (no stray .js in the module folder)
- Verify tests are adjacent and named `*.test.ts` and run via the package's test script (Vitest)
- Confirm README contains API signatures and examples that match the tests

## Technical Debt & Risks
- Risk: Structure may not match future requirements; mitigate by following parser and epic guidelines
- Debt: Initial setup only, no implementation; track in follow-up stories

## References
- [Skills System Epic](epic.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
Skills module folder and files are created (or will be created), follow the parser/test-adjacent style, and include a README that documents API behavior and test harness flows. The story is scoped to structure (no implementation) so code should be implemented in follow-up stories.

## Example File Structure
```
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
