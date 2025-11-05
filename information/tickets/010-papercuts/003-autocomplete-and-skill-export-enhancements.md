# Story: Autocomplete and Skill Export Enhancements

## Summary
Improve the Brainy VS Code extension by adding autocomplete for models and skills, and supporting skill export as VS Code tools.

## Motivation
- Users need faster, more accurate access to available models, skills, and their options.
- Exported skills should be easily registered as VS Code tools for better integration.

## Acceptance Criteria
- Autocomplete is available for models, skills, and their options in the VS Code extension.
- When a skill is exported with an `expose` flag, it is registered as a VS Code tool.

**Clarifications:**
- Autocomplete for skill flags/parameters should support descriptions (show flag descriptions in suggestions).
- If a skill does not provide a paramsSchema, show no suggestions for its flags.
- If a skill’s paramsSchema changes at runtime, the registry does not need to update automatically.
- Autocomplete suggestions do not need to be context-aware (show all flags regardless of usage in the current line).
- No restrictions or naming conventions are required for VS Code command IDs for skill export.
- e2e tests should cover both built-in and user-defined (project) skills for autocomplete and export.

## Out of Scope
- Autocomplete for non-skill-related features.
- Export mechanisms outside the VS Code extension.

## Additional Notes
Coordinate with extension maintainers for integration. Document new autocomplete and export features for users.

### Example: Skill Flags/Parameters via Zod Schema

```ts
import { z } from 'zod';

// In each skill definition file
export const paramsSchema = z.object({
	prompt: z.string(),
	variable: z.string().optional(),
	// ...other flags
});

export const mySkill: Skill = {
	name: 'my-skill',
	description: '...',
	paramsSchema, // <-- attach schema to skill
	async execute(api, params) { /* ... */ }
};

// At extension activation or skill scan
import * as skills from './skills';
const skillFlagsRegistry = new Map();
for (const skill of Object.values(skills)) {
	if (skill.paramsSchema) {
		const flagNames = Object.keys(skill.paramsSchema.shape);
		skillFlagsRegistry.set(skill.name, flagNames);
	}
}

// In completion provider, use skillFlagsRegistry to suggest flags for the current skill
const flags = skillFlagsRegistry.get(currentSkillName) || [];
for (const flag of flags) {
	items.push(new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field));
}
```

### Example: Autocomplete Implementation

```ts
// Register a completion provider for markdown
context.subscriptions.push(
	vscode.languages.registerCompletionItemProvider(
		{ language: 'markdown' },
		new BrainyCompletionProvider(),
		'@', '-', '"' // Trigger characters
	)
);

// Completion provider implementation
export class BrainyCompletionProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(document, position) {
		const line = document.lineAt(position).text;
		const items: vscode.CompletionItem[] = [];
		// Suggest skills after '@'
		if (/@\w*$/.test(line)) {
			for (const skill of getAvailableSkills()) {
				items.push(new vscode.CompletionItem(skill, vscode.CompletionItemKind.Function));
			}
		}
		// Suggest models after --model
		if (/--model\s*"?\w*$/.test(line)) {
			for (const model of getModelList()) {
				items.push(new vscode.CompletionItem(model, vscode.CompletionItemKind.Value));
			}
		}
		// Suggest skill options after '--'
		if (/--\w*$/.test(line)) {
			items.push(new vscode.CompletionItem('prompt', vscode.CompletionItemKind.Field));
			items.push(new vscode.CompletionItem('variable', vscode.CompletionItemKind.Field));
			// ...add more options as needed
		}
		return items;
	}
}
```

### Example: Skill Export as VS Code Tool

```ts
// Add expose flag to skill definition
export const mySkill: Skill = {
	name: 'my-skill',
	description: '...',
	expose: true, // <-- new flag
	async execute(api, params) { /* ... */ }
};

// Register exposed skills as VS Code commands
async function registerExposedSkills(context: vscode.ExtensionContext) {
	for (const skillName of getAvailableSkills()) {
		const skillMeta = await loadSkill(skillName, vscode.workspace.workspaceFolders?.[0]?.uri);
		if (skillMeta.expose) {
			const commandId = `brainy.skill.${skillName}`;
			context.subscriptions.push(
				vscode.commands.registerCommand(commandId, async (...args) => {
					const skill = await loadSkill(skillName, vscode.workspace.workspaceFolders?.[0]?.uri);
					await skill.execute(/* SkillApi */, { ...args[0] });
				})
			);
		}
	}
}
// Call this in activate()
await registerExposedSkills(context);
```
