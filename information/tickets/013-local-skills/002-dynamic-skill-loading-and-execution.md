## Title
Dynamic loading and execution of transpiled skills

## Problem
Transpiled skills must be loaded and executed safely. Without a standard interface, skills cannot be reliably managed or triggered.

## Solution
Transpile and eval the skill file on each execution request. Enforce a standard skill interface. Expose skills to the extension command palette and API.

## Acceptance Criteria
- All tests are passing.
- Skills are loaded dynamically and executed directly from file.
- Only valid skills (matching the interface) are executed.
- Skills can be triggered from the extension.
- Executor module is unit tested.

## Tasks/Subtasks
- [ ] Add require/evaluate wrapper for dynamic loading
- [ ] Validate skill exports and enforce interface
- [ ] Expose skills to command palette and API
- [ ] Unit test executor

## Open Questions

## Clarifications & Decisions

- Skill execution will use `eval` for all skills (no sandboxing for now).
- Skill validation and execution errors will be surfaced in the UI via skill hover tooltips; no silent failures.
- The skill interface is strictly limited to `execute(params)` and basic metadata, matching built-in skills.
- Command registration for skill execution will use the standard params structure, same as built-in skills.
- All skill outputs will be treated as strings for UI display (use `.toString()` if needed).
- TypeScript type checking is sufficient for skill params; no runtime validation needed.
- Skills will be hot-reloaded via file watchers; transpile and eval on each execution for latest code.
- No restrictions on what skills can do (file system, network, etc.) at this stage.
## Additional Info & References
- Epic: Local Project Skills Pickup and Execution
## Important code example
<Parse the existing relavant code and add the important code examples of a code that has to be adapted, or added to the existing codebase.>

## Files to Change (and Why)
- `src/skills/skillLoader.ts`: Add support for dynamic require/evaluate of transpiled skills. Enforce the Skill interface and validate exports. No registry needed.
- `src/skills/types.ts`: Ensure the Skill interface is robust and supports runtime validation.
- `src/skills/index.ts`: Re-export execution APIs for skills.
- `src/extension.ts`: Expose skill execution via command palette and API. Handle errors and user feedback.
- (Optional) test files for executor module.

## Important Code Snippets & Changes

### Skill Hover Error Validation Tooltip
```ts
// skillHoverProvider.ts
import * as vscode from 'vscode';
import { transpileSkill } from './transpiler';
import { Skill } from './types';

export class SkillHoverProvider implements vscode.HoverProvider {
  constructor(private skillsDir: string) {}

  async provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const skillName = getSkillNameAtPosition(document, position); // implement this
    try {
      const skillPath = path.join(this.skillsDir, `${skillName}.ts`);
      const tsCode = fs.readFileSync(skillPath, 'utf8');
      const jsCode = transpileSkill(tsCode);
      const skill: Skill = eval(jsCode);
      if (!skill || typeof skill.execute !== 'function') throw new Error('Invalid skill');
      return new vscode.Hover(`Skill: ${skillName}\nValid skill`);
    } catch (err) {
      const errorMsg = err && err.stack ? err.stack : (err && err.message ? err.message : String(err));
      return new vscode.Hover(`Skill: ${skillName}\nError: ${errorMsg}`);
    }
  }
}
```

### Dynamic Require/Evaluate and Execution

```ts
// skillLoader.ts
import { transpileSkill } from './transpiler';

// Surface execution errors in the UI/editor using the same mechanism as validation errors (e.g., tooltip or inline message)
export async function executeSkillByName(skillName: string, skillsDir: string, params: SkillParams) {
  try {
    const skillPath = path.join(skillsDir, `${skillName}.ts`);
    if (!fs.existsSync(skillPath)) throw new Error('Skill file not found');
    const tsCode = fs.readFileSync(skillPath, 'utf8');
    const jsCode = transpileSkill(tsCode);
    const skill: Skill = eval(jsCode); // Consider using vm for safety
    if (!skill || typeof skill.execute !== 'function') throw new Error('Invalid skill');
    return await skill.execute(params);
  } catch (err) {
    // Pass the full error object up for UI display
    throw err;
  }
}

// In the UI (e.g., hover provider or command), display execution errors just like validation errors:
// Example:
// vscode.window.showErrorMessage(`Skill error: ${errorMsg}`);
// or return new vscode.Hover(`Skill: ${skillName}\nError: ${errorMsg}`);
```

### Extension Command Registration
```ts
// extension.ts
vscode.commands.registerCommand('brainy.runSkill', async (skillName, params) => {
  try {
    const result = await executeSkillByName(skillName, skillsDir, params);
    vscode.window.showInformationMessage(`Skill result: ${result}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Skill error: ${err.message}`);
  }
});
```

### Skill Object Example
```ts
// skills/file.ts
// all params are translated into flags
// @file --action "write" --path "./test.json" --content "hello world"
export interface Params {
  action: "read" | "write" | "delete";
  path: string;
  content?: string;
}

// Global type
export interface Skill {
  name: string;
  description: string;
  execute: (params: Params) => Promise<string>;
  // Params type should be exported for system introspection (consider Zod for future evolution)
}

export const fileSkill: Skill = {
  description: "Read, write and delete files.",
  async execute(params) {
    // Implementation logic here
    // Return output as string
    return "<result>";
  }
};
```

**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.