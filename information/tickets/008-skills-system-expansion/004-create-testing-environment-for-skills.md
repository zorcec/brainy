## Title
Create a testing environment for built-in skills and cover it with tests

## Problem
Currently, Brainy’s built-in skills lack a dedicated testing environment. This makes it difficult to ensure reliability, context isolation, and deterministic behavior. Without proper tests, regressions and context leaks may go unnoticed, impacting agent workflows and user trust.

## Solution
Set up an isolated test environment for built-in skills only (not project/user-defined skills). Use Vitest-based unit tests that mock the skills system API and use spies to verify skill logic and interactions. Always import the SkillApi type from the real implementation and ensure the mock reflects all properties and APIs. A single, centralized mock SkillApi implementation must be created and reused by all built-in skill tests to ensure consistency and reduce duplication. Automated tests should validate skill execution, context hygiene, determinism, and error handling. Each skill should be tested as an individual feature; APIs used by the skill must be mocked if not safe. Skills can be tested by importing and executing the skill or its functions, whichever is more appropriate. E2E tests are optional unless gaps are found in unit coverage. There is no CI integration at this stage.

## Acceptance Criteria
- All built-in skills have Vitest unit tests (project/user-defined skills are out of scope)
- Skills system API is mocked and spied on, always importing the type from the real API and reflecting all properties/APIs in the mock
- Test environment is isolated from production and development
- Tests validate context hygiene, determinism, and error handling; each skill is tested as an individual feature
- All tests are passing

## Tasks/Subtasks
- [ ] Design test environment architecture (built-in skills only)
- [ ] Implement Vitest test harness for skills
- [ ] Mock and spy on skills system API, always importing the type from the real API and reflecting all properties/APIs in the mock
- [ ] Link mock and the api with the comments to keep it in sync
- [ ] Write unit tests for each built-in skill
- [ ] Validate context isolation and determinism; mock APIs used by skills if not safe
- [ ] Document test setup, usage, and best practices in a central markdown file

## Open Questions
- Are there specific edge cases for skill context isolation?
- Should tests include performance benchmarks? No
- What frameworks/libraries should be used for skill testing? vitest only
- Should skills be called with invalid parameters? No, the skills system should always call skills with correct options. Consider using Zod for parameter validation; create a placeholder story for this.

## Additional Info & References
- [Project Overview](../../../../project/overview.md)
- [Developing Guideline](../../../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../../../project-overview.md)
- [README](../../../../README.md)

## Proposal
- Create a dedicated test directory for skills
- Use Vitest as the test runner for automation
- Mock and spy on the skills system API to verify skill logic and interactions; always import the type from the real API and keep the mock in sync
- Write unit tests for each built-in skill, covering context handling and edge cases; test by importing and executing the skill or its functions as appropriate
- E2E tests are optional unless gaps are found in unit coverage
- Document the process for adding new skill tests and best practices in a central markdown file
## Testing Best Practices for Built-in Skills

- Only built-in skills are covered by this test environment; project/user-defined skills are out of scope.
- Always import the SkillApi type from the real implementation and ensure the mock reflects all properties and APIs.
- Mock APIs used by skills if they are not safe for direct use (e.g., filesystem, environment variables).
- Test each skill as an individual feature, using normal unit test patterns (import and execute the skill or its functions).
- Simpler is better for error handling; string matching on error messages is sufficient for now.
- Document all test utilities, patterns, and best practices in a central markdown file in information/docs/ and link it from the root README.
- Every new built-in skill PR should include a usage example and a test case as a requirement.
- There is no CI integration at this stage.

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
const mockApi: SkillApi = { // utility in central place
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
