## Title
Register skills as GitHub Copilot tools

### Challenge Reflection & Answers
- Are there specific Copilot APIs or formats required for tool registration, and how will you ensure compatibility?
	- There is a VS Code API; if it changes, we will know and adapt.
- Should skill registration be dynamic (at runtime) or static (at build/package time)?
	- Registration occurs when the extension is loaded (must support custom and built-in skills).
- How will you handle updates or removals of skills—should the registration list be refreshed automatically?
	- Only on restart of the extension.
- What metadata is required for each skill to be properly exposed as a Copilot tool (e.g., input schema, description)?
	- Check the official documentation for requirements.
- How will you validate that all skills are discoverable and usable by Copilot, beyond e2e tests?
	- e2e tests are sufficient; at least verify if one skill is registered (use a dummy skill for this).
- Are there edge cases with skill naming, versioning, or conflicts?
	- No.
- Should registration support custom user-defined skills, or only built-in and local ones?
	- Yes, both.
- How will you document the registration process for future contributors?
	- Try to find a README file related to the skills and update it as needed.
Document the registration process and validate with e2e tests that all skills are exposed and discoverable.
## Problem
Skills are not currently registered as GitHub Copilot tools, preventing their use and discovery within the Copilot ecosystem.

## Solution
Implement registration logic so all skills are properly exposed and usable as Copilot tools.

## Acceptance Criteria
- All tests are passing.
- All skills are registered and discoverable as Copilot tools.
- Registration is validated for new and existing skills.

## Tasks/Subtasks
- [ ] Implement skill registration logic for Copilot tools.
- [ ] Write tests to verify registration and discovery.
- [ ] Document registration process for future skills.

## Open Questions
- <PLACEHOLDER: Are there specific Copilot APIs or formats to follow?>
- <PLACEHOLDER: Should registration be dynamic or static?>

## Additional Info & References
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal

## Implementation Analysis & Important Code Changes
- Skills are discovered via `skillScanner.ts` (built-in and local skills).
- Currently, only statically defined skills are exposed in `package.json` under `contributes.languageModelTools`.
- To register all skills as Copilot tools:
	1. On extension activation or skill refresh, parse all available skills.
	2. For each skill, generate a Copilot tool definition (name, displayName, description, input schema).
	3. If VS Code API allows, register these tools dynamically; otherwise, update static registration in `package.json`.

### Example Code Block
```typescript
// After refreshing skills
const skills = getAvailableSkills();
const copilotTools = skills.map(skillName => {
	// Fetch skill metadata (description, params, etc.)
	const skill = loadSkill(skillName);
	return {
		name: skill.name,
		displayName: skill.description || skill.name,
		modelDescription: skill.description,
		inputSchema: skill.inputSchema // define schema for each skill
	};
});

// If VS Code API allows, register copilotTools dynamically
// Otherwise, update package.json statically
```

- Document the registration process and validate with tests that all skills are exposed and discoverable.
