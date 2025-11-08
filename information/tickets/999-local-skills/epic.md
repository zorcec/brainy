# Epic: Local Project Skills Pickup and Execution

## Overview
Implement a system in Brainy that enables the VSCode extension to discover, transpile, and execute local project skills written in TypeScript (`.ts`). This will allow users to define custom skills in their project, which the extension can dynamically load and run.

## Goals
- Discover `.ts` skill files in a designated folder
- Transpile TypeScript skills to JavaScript within the extension
- Dynamically require/evaluate transpiled skills for execution
- Provide an interface for triggering skills from the extension
- Ensure robust error handling, logging, and security
- Document the system and provide usage examples
- Cover with unit and integration tests

## Implementation Steps

```markdown
```

## Key Code Changes & Architecture

- **Skill Discovery**
	- Add a skill loader module in `vscode-extension/src/skills/` to scan for `.ts` files in a configurable folder (e.g., `.skills/` at project root).
	- Update extension activation to trigger skill scan on startup and workspace change.
- **Transpilation**
	- Integrate TypeScript transpilation using `ts.transpileModule` or a lightweight build step in the extension (no external process required).
	- Cache transpiled JS in memory or temp directory for fast require/evaluate.
- **Dynamic Loading & Execution**
	- Implement a safe `require/evaluate` wrapper in the extension to load transpiled skills.
	- Define a skill interface (e.g., `Skill { name: string; run(...args): Promise<any>; }`) and enforce it via type checks.
	- Add a registry for loaded skills, exposing them to the extension command palette and API.
- **Extension API**
	- Add commands to list, run, and reload skills from the extension UI/API.
	- Provide error handling, logging, and security checks (sandboxing, validation).
- **Testing & Docs**
	- Add unit tests for loader, transpiler, and executor modules.
	- Write documentation and usage examples in `README.md` and `/information/project/docs/`.

## Suggested Story Names (Minimal)

1. Local Skill Discovery & Transpilation
2. Dynamic Skill Loading & Execution
3. Extension API, Testing & Documentation

---

**Implementation Approach:**
- Skills are TypeScript modules in a designated folder (default: `.skills/`).
- The extension scans for `.ts` files, transpiles them to JS, and loads them dynamically.
- Skills must export a standard interface (`Skill`).
- The extension exposes commands to run/reload skills and provides robust error handling.
- All new code is covered by tests and documented for maintainability.

## Acceptance Criteria
- Local skills can be discovered, transpiled, and executed from the extension
- Clear documentation and examples are provided
- All new code is covered by tests
- No security or stability regressions

---

**Related:** See `/root/workspace/brainy/information/tickets/999-local-skills/` for context and prior notes.
