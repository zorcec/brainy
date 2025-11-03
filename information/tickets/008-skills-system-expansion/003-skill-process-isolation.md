---
title: "Skill Process Isolation and Node.js API Access"
description: "Story to refactor skill execution so each skill runs in an isolated Node.js process with only Node.js APIs available."
status: "draft"
created: "2025-11-03"
---

# Story: Skill Process Isolation and Node.js API Access

## Background
The epic requires that all skills run in isolated Node.js processes, with no access to VS Code APIs. Only Node.js APIs should be available, and the working directory for each skill should be set to the project root. This ensures security, stability, and prevents accidental coupling to VS Code internals.

## Goals
- Refactor skill execution so each skill runs in a separate Node.js process.
- Ensure only Node.js APIs are available inside skills.
- Set the working directory for each skill process to the project root.
- Remove any VS Code API exposure from skills.
- Maintain compatibility with built-in and project skills.
- Preserve hot-reloading and dynamic registration features.

## Implementation Plan
- Update the skill loader to spawn a child Node.js process for each skill execution.
- Pass skill parameters and API requests via IPC (JSON-over-IPC).
- Ensure the SkillApi only exposes messaging to the main process, not VS Code APIs.
- Remove any direct imports or usage of VS Code APIs from skills.
- Set the working directory for each skill process to the project root.
- Update documentation to reflect the new isolation model.
- Add unit tests to verify isolation and correct API access.

## Acceptance Criteria
- Skills run in isolated Node.js processes.
- Only Node.js APIs are available inside skills.
- Working directory is set to the project root for each skill process.
- No VS Code API is accessible inside skills.
- Skill loader supports both built-in and project skills with isolation.
- Hot-reloading and dynamic registration are preserved.
- Unit tests cover process isolation and API access.

## Code References & Required Changes

### Skills API & Loader (Current)
- `src/skills/types.ts` (Skill, SkillApi)
- `src/skills/skillLoader.ts` (loadSkill, executeSkill, runSkill)
- `src/skills/skillApi.ts` (createSkillApi)

### Example: Skill Loader (Process Isolation)
```typescript
import { fork } from 'child_process';
function executeSkillIsolated(skillPath: string, params: SkillParams, projectRoot: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = fork(skillPath, [], { cwd: projectRoot, stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
    child.send({ params });
    child.on('message', (result) => resolve(result));
    child.on('error', reject);
    child.on('exit', (code) => { if (code !== 0) reject(new Error('Skill process failed')); });
  });
}
```

### Example: Skill Implementation (Node.js APIs Only)
```typescript
import { promises as fs } from 'fs';
export const fileSkill = {
  name: 'file',
  description: 'Read, write and delete files.',
  async execute(params) {
    const { action, path, content } = params;
    if (action === 'read') {
      return await fs.readFile(path, 'utf8');
    }
    // ...other actions
  }
};
```

### Example: IPC Messaging in Skill Process
```typescript
process.on('message', async ({ params }) => {
  // Use only Node.js APIs here
  // To send a request to the main process:
  process.send({ type: 'sendRequest', ... });
});
```

### Loader: Set Working Directory
```typescript
const child = fork(skillPath, [], { cwd: projectRoot });
```

## Migration & Testing Requirements
- **Existing skills must be adapted as needed to work in isolated Node.js processes.**
- All unit and e2e tests must pass after refactoring.
- Skills must use only Node.js APIs; remove any VS Code API usage.
- Loader and SkillApi must support process isolation and IPC.

## Out of Scope
- Support for running skills in other languages.
- Advanced sandboxing or security features.
- E2E tests for skill logic (unit tests only).

## Risks & Mitigations
- Increased complexity: Mitigate with clear documentation and modular code.
- Performance overhead: Minimize by efficient process management.
- Compatibility issues: Test thoroughly with both built-in and project skills.

## Next Steps
- Design IPC protocol for skill communication.
- Refactor skill loader and update tests.
- Update documentation and usage examples.

---
