## Title
Add TypeScript support for skills (execute TypeScript on the fly)

## Problem
Currently, skills in the test-project are limited to plain JavaScript. Many developers prefer writing skills in TypeScript for type safety and better tooling. Without TypeScript support, skill authors must manually transpile code or forgo type checking, reducing productivity and increasing the risk of runtime errors.

## Solution
Enable the playbook runner and skill loader to execute TypeScript skill files directly, without requiring manual pre-compilation. This allows skill authors to write `.ts` files, and the system will handle transpilation and execution automatically.

## Proposal

### TypeScript Skill Execution
- Use the `ts-node` package to execute TypeScript files on the fly. `ts-node` registers a TypeScript compiler hook, allowing Node.js to run `.ts` files as if they were JavaScript.
- Update the skill runner to detect `.ts` files and require them using `ts-node/register`.
- Document the workflow for writing TypeScript skills and provide a minimal example skill in TypeScript.
- Add a test TypeScript skill at `packages/vscode-extension/e2e/test-project/skills/execute.ts`:
  ```typescript
  // Minimal hello world execute skill in TypeScript
  export async function run(api: any, params: any): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return {
      exitCode: 0,
      stdout: 'hello world',
      stderr: ''
    };
  }
  ```
- Update e2e tests to validate that both `.js` and `.ts` skills are supported and produce deterministic output.

### API Injection for TypeScript Skills
For consistency with JavaScript skills, the API object should be injected directly when requiring the skill module. No messaging or IPC wrapper is needed for API injection in the minimal scenario.

**Example runner logic:**
```typescript
import { register } from 'ts-node';
register();
const api = { /* ...methods... */ };
const skill = require('./skills/execute.ts');
skill.run(api, params).then(result => {
  // handle result
});
```

**Example TypeScript skill:**
```typescript
export async function run(api: any, params: any): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  // Use the injected API directly
  return {
    exitCode: 0,
    stdout: 'hello world',
    stderr: ''
  };
}
```

This approach keeps the skill contract simple and avoids the complexity of IPC wrappers for API injection. For more advanced scenarios, IPC can be added later.

## Acceptance Criteria

- The skill runner can execute `.ts` skill files using `ts-node`.
- A minimal TypeScript skill exists at `packages/vscode-extension/e2e/test-project/skills/execute.ts` and exports `run(api, params)`.
- The playbook runner and e2e tests validate skill invocation and result handling for both JavaScript and TypeScript skills.
- Documentation is updated to show how to write and run TypeScript skills.

## Tasks/Subtasks

- [ ] Add `ts-node` as a dev dependency in the test-project.
- [ ] Update skill runner logic to detect `.ts` files and use `ts-node` for execution.
- [ ] Add a minimal TypeScript skill script to `skills/execute.ts`.
- [ ] Update e2e tests to cover TypeScript skill execution.
- [ ] Document the workflow and add code examples in the README.

## Open Questions

- Should we support advanced TypeScript features (e.g., decorators, custom config), or only basic syntax?
- Is there a need to cache transpiled output for performance, or is on-the-fly execution sufficient for e2e tests?

## Additional Info

- Risks: `ts-node` adds some startup overhead; ensure tests remain fast.
- Testability: e2e tests should cover both `.js` and `.ts` skills.
- Example skill and runner logic provided above.

## References

- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)
- [ts-node documentation](https://typestrong.org/ts-node/)
- [Node.js child_process.spawn](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options)
- Example skill: `packages/vscode-extension/e2e/test-project/skills/execute.ts`
- Skill runner logic: `packages/vscode-extension/src/skills/`

