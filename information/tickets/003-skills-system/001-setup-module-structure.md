
## Title
Skills System Module Structure Setup

## Context
Brainy needs a minimal, testable skills API for VS Code extension authors. The module must follow the parser’s function-based, test-adjacent style and support future agent workflows.

## Goal
Create the initial skills system module structure in `packages/vscode-extension/src/skills/` with all required files, ready for API and test implementation.

## Implementation Plan
- Create `index.ts`, `modelClient.ts`, `sessionStore.ts`, `errors.ts` in the skills folder
- Add adjacent test files: `index.test.ts`, `modelClient.test.ts`, `sessionStore.test.ts`
- Add a `README.md` documenting API signatures and usage
- Ensure all files use pure functions and inline types

## Edge Cases & Testing
- Check for missing or misnamed files
- Validate test files are adjacent and named correctly
- Confirm README includes API and test examples

## Technical Debt & Risks
- Risk: Structure may not match future requirements; mitigate by following parser and epic guidelines
- Debt: Initial setup only, no implementation; track in follow-up stories

## References
- [Skills System Epic](epic.md)
- [Parser Module](../../project/preparation/parser.md)
- [Developing Guideline](../../../../developing-guideline.md)

## Outcome
Skills module folder and files are created, matching project style and ready for API implementation and tests.

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
