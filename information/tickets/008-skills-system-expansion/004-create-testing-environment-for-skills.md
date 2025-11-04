## Title
Create a testing environment for built-in skills and cover it with tests

## Problem
Currently, Brainy’s built-in skills lack a dedicated testing environment. This makes it difficult to ensure reliability, context isolation, and deterministic behavior. Without proper tests, regressions and context leaks may go unnoticed, impacting agent workflows and user trust.

## Solution
Set up an isolated test environment for built-in skills. Focus on Vitest-based unit tests that mock the skills system API and use spies to verify skill logic and interactions. Automated tests should validate skill execution, context hygiene, determinism, and error handling. E2E tests are optional unless gaps are found in unit coverage. Integrate tests with CI to ensure ongoing reliability.

## Acceptance Criteria
- All built-in skills have Vitest unit tests
- Skills system API is mocked and spied on to verify correct logic and interactions
- Test environment is isolated from production and development
- Tests validate context hygiene, determinism, and error handling
- CI integration for test runs
- All tests are passing

## Tasks/Subtasks
- [ ] Design test environment architecture
- [ ] Implement Vitest test harness for skills
- [ ] Mock and spy on skills system API
- [ ] Write unit tests for each built-in skill
- [ ] Validate context isolation and determinism
- [ ] Integrate with CI pipeline
- [ ] Document test setup and usage

## Open Questions
- Are there specific edge cases for skill context isolation?
- Should tests include performance benchmarks?
- What frameworks/libraries should be used for skill testing?

## Additional Info & References
- [Project Overview](../../../../project/overview.md)
- [Developing Guideline](../../../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../../../project-overview.md)
- [README](../../../../README.md)

## Proposal
- Create a dedicated test directory for skills
- Use Vitest as the test runner for automation
- Mock and spy on the skills system API to verify skill logic and interactions
- Write unit tests for each built-in skill, covering context handling and edge cases
- E2E tests are optional unless gaps are found in unit coverage
- Ensure tests run in CI and report results
- Document the process for adding new skill tests

---

## References & Code Files
- [Skill API Implementation](../../../../../packages/vscode-extension/src/skills/skillApi.ts)
- [Skill API Unit Tests](../../../../../packages/vscode-extension/src/skills/skillApi.test.ts)
- [Skills System Entry Point](../../../../../packages/vscode-extension/src/skills/index.ts)
- [Skills System API Types](../../../../../packages/vscode-extension/src/skills/types.ts)
- [Skill Loader](../../../../../packages/vscode-extension/src/skills/skillLoader.ts)
- [Built-in Skills Registry](../../../../../packages/vscode-extension/src/skills/built-in/index.ts)
- [File Skill Implementation](../../../../../packages/vscode-extension/src/skills/built-in/file.ts)
- [File Skill Unit Tests](../../../../../packages/vscode-extension/src/skills/built-in/file.test.ts)
- [Skills System README](../../../../../packages/vscode-extension/src/skills/README.md)
- [Skills API Integration Tests](../../../../../packages/vscode-extension/src/skills/index.test.ts)

## Code Snippets & Examples

### Skill Interface
```typescript
export interface Skill {
  name: string;
  description: string;
  execute(api: SkillApi, params: SkillParams): Promise<string>;
}
```

### Skill API Implementation
```typescript
export function createSkillApi(): SkillApi {
  return {
    async sendRequest(role, content, modelId) {
      const response = await modelSendRequest({ role, content, modelId });
      return { response: response.reply };
    },
    async selectChatModel(modelId) {
      setSelectedModel(modelId);
    }
  };
}
```

### Built-in File Skill Example
```typescript
export const fileSkill: Skill = {
  name: 'file',
  description: 'Read, write and delete files.',
  async execute(api, params) {
    const { action, path, content } = params;
    // Validate and perform action...
  }
};
```

### Unit Test Example for Skill Logic
```typescript
import { vi } from 'vitest';
const mockApi: SkillApi = {
  sendRequest: vi.fn(async () => ({ response: 'mock' })),
  selectChatModel: vi.fn()
};

it('should call sendRequest with correct params', async () => {
  await someSkill.execute(mockApi, { ...params });
  expect(mockApi.sendRequest).toHaveBeenCalledWith('user', 'expected content', 'gpt-4o');
});
```

### Test Skill Context Isolation
Run each skill in a fresh process and verify no state leaks between runs.
