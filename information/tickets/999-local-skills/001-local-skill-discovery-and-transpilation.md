## Title
Discover and transpile local TypeScript skill files

## Problem
The extension cannot use project-specific skills unless it can find and convert `.ts` skill files to JavaScript. Without this, custom automation is impossible.

## Solution
Scan a designated folder (e.g., `.skills/`) for `.ts` files, transpile them to JS using an in-extension pipeline, and cache the results for fast loading.

## Acceptance Criteria
- All tests are passing.
- `.ts` skill files are discovered on extension activation and workspace change.
- Skills are transpiled to JS and cached.
- Errors are logged and handled gracefully.
- Loader and transpiler modules are unit tested.

## Tasks/Subtasks
- [ ] Implement skill loader module in `vscode-extension/src/skills/`
- [ ] Scan for `.ts` files in the configured folder
- [ ] Integrate TypeScript transpilation (e.g., `ts.transpileModule`)
- [ ] Cache transpiled JS in memory or temp directory
- [ ] Unit test loader and transpiler

## Open Questions

## Clarifications & Decisions

- The skills folder will always be `.skills/` (not configurable).
- Transpilation errors will be surfaced as skill validation errors: skills with invalid syntax are marked as invalid, and error details (with sourcemaps) are shown in a tooltip on hover.
- Skill execution will use `eval` (not Node’s `vm`).
- In-memory caching of transpiled JS is sufficient; no persistence across reloads.
- Cache invalidation will be handled via filesystem watchers.
- Unit tests for loader and transpiler should cover all error cases and scenarios thoughtfully; e2e tests should also cover these cases.
- The `Skill` interface does not require additional properties or metadata beyond `execute(params)` and API, matching built-in skills.
- Skill scanning will trigger on file creation and deletion, not just on activation/workspace change.
- No performance concerns for large numbers of skills at this stage.

## Additional Info & References
- Epic: Local Project Skills Pickup and Execution
- VSCode extension API docs
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Important code example
<Parse the existing relavant code and add the important code examples of a code that has to be adapted, or added to the existing codebase.>

## Files to Change (and Why)
- `src/skills/skillScanner.ts`: Extend to scan for `.ts` files in the project’s `.skills/` folder (not just built-in skills). Add logic to discover and list project-local skills.
- `src/skills/skillLoader.ts`: Update to support loading and transpiling local TypeScript skill files. Integrate TypeScript transpilation. No registry needed; always transpile/eval on request.
- `src/skills/types.ts`: Ensure the `Skill` interface supports local skills and is compatible with project skill definitions.
- `src/extension.ts`: Trigger skill scan and refresh on extension activation and workspace change. Surface errors and status to the user.
- `src/skills/index.ts`: Re-export new/updated APIs for skill discovery and loading.
- (New) `src/skills/transpiler.ts`: Utility for TypeScript → JavaScript transpilation, used by the loader.
- (Optional) test files for loader, scanner, and transpiler modules.

## Important Code Snippets & Changes

### Skill Discovery (Scanner)

```ts
// skillScanner.ts (with VSCode API file watching)
import * as vscode from 'vscode';
import * as path from 'path';

export function watchSkillFiles(skillsDir: string, onChange: () => void) {
  const pattern = new vscode.RelativePattern(skillsDir, '*.ts');
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  watcher.onDidCreate(onChange);
  watcher.onDidChange(onChange);
  watcher.onDidDelete(onChange);
  return watcher;
}

export function scanLocalSkills(skillsDir: string): string[] {
  // Use VSCode workspace API to read files if possible, fallback to Node.js fs
  // For simplicity, still use fs for initial scan
  const fs = require('fs');
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir)
    .filter((f: string) => f.endsWith('.ts'))
    .map((f: string) => path.basename(f, '.ts'));
}
```

### TypeScript Transpilation (Transpiler Utility)
```ts
// transpiler.ts
import * as ts from 'typescript';

export function transpileSkill(tsCode: string): string {
  const result = ts.transpileModule(tsCode, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  return result.outputText;
}
```

### Skill Loader (Loading Local Skills)

```ts
// skillLoader.ts
import { transpileSkill } from './transpiler';

export async function executeSkillByName(skillName: string, skillsDir: string, params: SkillParams) {
  const skillPath = path.join(skillsDir, `${skillName}.ts`);
  if (!fs.existsSync(skillPath)) throw new Error('Skill file not found');
  const tsCode = fs.readFileSync(skillPath, 'utf8');
  const jsCode = transpileSkill(tsCode);
  const skill: Skill = eval(jsCode); // Consider using vm for safety
  if (!skill || typeof skill.execute !== 'function') throw new Error('Invalid skill');
  return await skill.execute(params);
}
```

### Extension Activation (Trigger Scan)
```ts
// extension.ts
const skillsDir = path.join(workspaceRoot, '.skills');
const localSkills = scanLocalSkills(skillsDir);
refreshSkills([...getBuiltInSkillNames(), ...localSkills]);
```


**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.