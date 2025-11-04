## Title
Implement Execute Skill (extend API)

## Problem
Users need to programmatically execute code blocks (e.g., Bash, Python, JS) from within Brainy playbooks and capture their output. Without an execute skill, workflows cannot automate code execution or chain results, limiting automation and reproducibility.

## Solution
Implement a built-in skill called `execute` that runs the next code block in the playbook, captures its output, and returns it as a string. The skill will support specifying the language and any required parameters. It will extend the Skill API if needed to support execution and output capture.

## Acceptance Criteria
- All tests are passing.
- The execute skill is available as a built-in skill and can be invoked from playbooks.
- The skill executes the next code block and returns the output.
- Errors are surfaced for missing/invalid parameters or execution failures.
- Unit tests cover normal and error cases.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the execute skill interface and parameters
- [ ] Implement the execute skill as a built-in skill
- [ ] Extend the Skill API to support code execution if needed
- [ ] Validate input and handle errors
- [ ] Write unit tests for normal and error cases
- [ ] Document usage and add an example

## Open Questions
- Should the skill support all code block languages, or only a subset?
- How should output and errors be formatted and returned?
- Should execution be synchronous or support async/streaming output?

## Additional Info & References
- Example usage: `@execute --language "bash"`
- Risks: code execution errors, security concerns
- Testability: unit tests with mock code execution
- See also: code block execution in project docs
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Create a new built-in skill in `src/skills/built-in/execute.ts`.
- The skill exports a `Skill` object with `name: 'execute'`, a description, and an async `execute` function.
- The `execute` function receives the SkillApi and params (expects `language` and optional parameters).
- Validate input; throw errors for missing/invalid params.
- Run the next code block using the specified language and capture output.
- Return the output string.
- Add unit tests using the centralized mock SkillApi and code execution mock.
- Document usage in the skill and in the testing best practices doc.

## Important code example

```ts
// src/skills/built-in/execute.ts
import { Skill, SkillApi, SkillParams } from '../types';

export const executeSkill: Skill = {
	name: 'execute',
	description: 'Execute the next code block and return its output.',
	async execute(api: SkillApi, params: SkillParams): Promise<string> {
		const { language, code } = params;
		if (!language || !code) {
			throw new Error('Missing language or code');
		}
		// Pseudo-code: run code and capture output
		// const output = await api.runCodeBlock(language, code);
		const output = '<executed output>';
		return output;
	}
};
```
