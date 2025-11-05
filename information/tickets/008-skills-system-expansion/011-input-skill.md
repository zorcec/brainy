## Title
Implement Input Skill with Variable Support

## Problem
There is no way for a playbook to request user input interactively and use it in later steps. This limits dynamic workflows and prevents user-driven branching or parameterization. Manual editing is error-prone and not user-friendly.

## Solution
Add an `input` skill that opens an input dialog in VS Code using a new Skill API. The user-provided value is stored in a variable. Variable support is added so that any variable can be injected into any context text block in the playbook using `{{name}}` syntax. The input skill waits for user input and resumes execution once the variable is set.

## Acceptance Criteria
- All tests are passing.
- The input skill opens a VS Code input dialog and stores the result in a variable using the `setVariable()` skill API.
- Variables can be injected into any context text block using `{{name}}` syntax.
- Execution pauses for user input and resumes when the variable is set.
- Errors are surfaced for missing/invalid variables or user cancellation.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the input skill interface and parameters
- [ ] Implement the input skill as a built-in skill
- [ ] Add a Skill API to open an input dialog in VS Code
- [ ] Implement variable assignment from user input
- [ ] Support variable injection in all context text blocks using `{{name}}`
- [ ] Handle errors and user cancellation
- [ ] Write unit and integration tests
- [ ] Document usage and add an example

## Open Questions
- Should input support validation (e.g., regex, required, default values)?
- Should input support multi-line or only single-line values?
- How should user cancellation be handled in playbook execution?

## Additional Info & References
- Example: `@input --prompt "Enter your name" --variable userName`
- Risks: user cancellation, invalid input, variable name collisions
- Testability: unit and integration tests with mock SkillApi and VS Code input dialog
- See also: variable support and playbook context injection

## Important Code Changes & Examples

### 1. Skill API: Open Input Dialog and Set Variable
```ts
// In SkillApi
async openInputDialog(prompt: string): Promise<string> {
	// Opens VS Code input box and returns user input
}

setVariable(name: string, value: string): void {
	// Stores the variable for later use
}
```

### 2. Input Skill Implementation
```ts
export const inputSkill: Skill = {
	name: 'input',
	description: 'Prompt the user for input and store it in a variable.',
	async execute(api: SkillApi, params: SkillParams): Promise<void> {
		const { prompt, variable } = params;
		if (!prompt || !variable) throw new Error('Missing prompt or variable name'); // live validation is needed
		const value = await api.openInputDialog(prompt);
		if (typeof value !== 'string') throw new Error('User cancelled input');
		api.setVariable(variable, value);
	}
};
```

### 3. Variable Injection in Context Blocks
```ts
function injectVariables(text: string, variables: Record<string, string>): string {
	return text.replace(/{{(\w+)}}/g, (_, v) => variables[v] ?? '');
}
```

### 4. Example Usage in Playbook
```md
@input --prompt "Enter your name" --variable userName

Hello, {{userName}}!