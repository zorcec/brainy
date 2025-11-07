# Story: Register all skills as tools

## Context
<PLACEHOLDER: Add any relevant context about current skill registration and tool usage>

## Goal
- Ensure all skills are registered as tools.
- Each skill controls registration with a flag in its definition.

## Acceptance Criteria
- All skills are registered as tools.
- Skills can opt-in or opt-out using a flag in their definition.

## Implementation Plan
- Audit current skills for registration status.
- Add flag to skill definitions to control tool registration.
- Update registration logic to respect the flag.

## Edge Cases & Testing
- Test registration for skills with and without the flag.
- Validate tool availability for all skills.

## Risks & Technical Debt
- Risk: Skills may be incorrectly registered or missed.
- Mitigation: Add tests and review registration logic.

## References
- See ideas.md for requirements.

## Outcome
- All skills are properly registered as tools, with flag control.

## Challenge Clarifications

- The opt-in/opt-out flag is opt-in: skills are not registered as tools unless the flag is set.
- The flag is static: set at definition time, not changeable at runtime.
- Only the file skill is enabled for debugging purposes; others are not registered as tools by default.
- The flag should be part of the exported Skill object.
- Registration errors (e.g., duplicate names, invalid flags) should show an error in the bottom right and the skill should not be registered.
- No test or linter rule is required; if the flag is not present, registration is disabled.
- No need for tool-specific metadata (categories, tags) beyond the flag.

---

## Implementation Analysis & Code Change Plan

### Important Code Changes

1. **Skill Type Update (`types.ts`):**
	 - Add an optional `registerAsTool?: boolean` property to the `Skill` interface.
	 - This allows each skill to opt-in to tool registration by setting this flag to `true`.

2. **Skill Definitions (`built-in/*.ts`):**
	 - Update the `file` skill to include `registerAsTool: true`.
	 - All other skills should not set this flag (or set it to `false` if desired).

3. **Skill Registration Logic (`built-in/index.ts`):**
	 - When registering skills as tools, check the `registerAsTool` flag.
	 - Only register skills as tools if `registerAsTool` is `true`.
	 - If a registration error occurs (e.g., duplicate name), show an error in the bottom right and skip registration.

4. **Skill Loader/Registry (`skillLoader.ts` or similar):**
	 - Ensure that tool registration logic respects the new flag and error handling.

---

### Files to Update and Why

- `packages/vscode-extension/src/skills/types.ts`
	- Update the `Skill` interface to include the `registerAsTool` flag.

- `packages/vscode-extension/src/skills/built-in/file.ts`
	- Add `registerAsTool: true` to the exported skill object.

- `packages/vscode-extension/src/skills/built-in/index.ts`
	- Update registration logic to check the flag and handle errors as specified.

- `packages/vscode-extension/src/skills/skillLoader.ts` (if tool registration is handled here)
	- Ensure loader respects the flag and error handling.

---

### Example Code Snippet

**types.ts**
```typescript
export interface Skill {
	name: string;
	description: string;
	// ...other properties...
	registerAsTool?: boolean; // Opt-in flag for tool registration
}
```

**file.ts**
```typescript
export const fileSkill: Skill = {
	name: 'file',
	description: 'Read, write and delete files.',
	// ...other properties...
	registerAsTool: true
};
```

**index.ts**
```typescript
for (const [name, skill] of builtInSkills) {
	if (skill.registerAsTool) {
		try {
			// Register as tool
		} catch (err) {
			vscode.window.showErrorMessage(`Failed to register skill '${name}' as tool: ${err.message}`);
			continue;
		}
	}
}
```

These changes will ensure only explicitly opted-in skills are registered as tools, with clear error handling and minimal impact on existing code.
