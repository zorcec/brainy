## Title
Implement Execute Skill (extend API)

## Problem
Users need to programmatically execute code blocks (e.g., Bash, Python, JS) from within Brainy playbooks and capture their output. Without an execute skill, workflows cannot automate code execution or chain results, limiting automation and reproducibility.

## Solution
Implement a built-in skill called `execute` that runs the next code block in the playbook, captures its output, and returns it as a string. The skill will support specifying the language and any required parameters.

The Skill API will be extended to provide:
- A getter to return all parsed blocks (e.g., `api.getParsedBlocks()`).
- A getter to return the current block index (e.g., `api.getCurrentBlockIndex()`).

This allows the execute skill to determine if the next parsed block is a code block and execute it accordingly.

## Acceptance Criteria
- All tests are passing.
- The execute skill is available as a built-in skill and can be invoked from playbooks.
- The skill executes the next code block and returns the output.
- The Skill API exposes getters for all parsed skills and the current skill index.
- The execute skill uses these getters to find and execute the next code block.
- Errors are surfaced for missing/invalid parameters or execution failures.
- Unit tests cover normal and error cases.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the execute skill interface and parameters
- [ ] Implement the execute skill as a built-in skill
- [ ] Extend the Skill API to support code execution if needed
- [ ] Add a getter to return all parsed skills
- [ ] Add a getter to return the current skill index
- [ ] Use these getters in the execute skill to find and execute the next code block
- [ ] Validate input and handle errors
- [ ] Write unit tests for normal and error cases
- [ ] Document usage and add an example


## Design Decisions & Open Questions

- **Non-code or Invalid Blocks:** If the next block is not a code block or is missing required metadata (like language), an error is thrown. The playbook parser should detect and show such errors immediately.
- **Multi-block Execution:** The execute skill only supports executing the immediate next code block, not multiple blocks in sequence.
- **Security:** No measures are taken to prevent accidental or malicious execution of dangerous code (e.g., Bash). All code is executed as-is.
- **Playbook Consistency:** If possible, the playbook should be made read-only during execution. Otherwise, consistency is not enforced and is left as-is.
- **Block Selection:** The execute skill always enforces strict sequential execution—only the next block can be executed, not arbitrary blocks.
- **Large/Binary/Sensitive Output:** Output is returned as-is, regardless of size, type, or sensitivity.
- **Hanging/Long-running Code:** No special handling for code that hangs or takes too long; it is left as-is.
- **Mock/Dry-run:** No support for mock or dry-run execution at this stage.

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
- The SkillApi provides `getParsedBlocks()` and `getCurrentBlockIndex()` getters.
- The execute skill uses these to check if the next parsed block is a code block and executes it if so.
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
