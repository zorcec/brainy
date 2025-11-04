# Testing Best Practices for Built-in Skills

This document outlines the best practices for testing built-in skills in Brainy.

## Scope
- Only built-in skills are covered by this test environment. Project/user-defined skills are out of scope.

## Centralized Mock SkillApi

All built-in skill tests use a centralized mock SkillApi implementation to ensure consistency and reduce duplication.

### Using the Mock

Import `createMockSkillApi` from `testUtils.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockSkillApi } from '../testUtils';
import { mySkill } from './mySkill';

describe('mySkill', () => {
  let mockApi: ReturnType<typeof createMockSkillApi>;

  beforeEach(() => {
    // Create a fresh mock API for each test
    mockApi = createMockSkillApi();
  });

  it('should execute successfully', async () => {
    const result = await mySkill.execute(mockApi, { param: 'value' });
    expect(result).toBe('expected result');
  });

  it('should call sendRequest with correct parameters', async () => {
    await mySkill.execute(mockApi, { prompt: 'test' });
    expect(mockApi.sendRequest).toHaveBeenCalledWith('user', 'test', 'gpt-4o');
  });
});
```

### Customizing Mock Behavior

Override the default mock behavior when needed:

```typescript
it('should handle custom response', async () => {
  // Override sendRequest to return specific response
  mockApi.sendRequest.mockResolvedValue({ response: 'custom response' });
  
  const result = await mySkill.execute(mockApi, {});
  expect(result).toContain('custom response');
});

it('should handle errors', async () => {
  // Simulate an error
  mockApi.sendRequest.mockRejectedValue(new Error('Model timeout'));
  
  await expect(mySkill.execute(mockApi, {})).rejects.toThrow('Model timeout');
});
```

## Mocking and Spying

- Always import the `SkillApi` type from the real implementation (`types.ts`).
- The centralized mock in `testUtils.ts` reflects all properties and APIs from the real SkillApi interface.
- Mock APIs used by skills if they are not safe for direct use (e.g., filesystem, environment variables).
- The mock API validates that all properties and methods are present, but does not need to validate argument types beyond what TypeScript provides.

## Keeping Mock and API in Sync

- **When modifying SkillApi in `types.ts`:** Update `createMockSkillApi()` in `testUtils.ts` to reflect all changes.
- Both files contain comments reminding developers to keep them in sync.
- The mock uses `vi.fn()` for all methods, allowing full spy capabilities in tests.

## Test Patterns

- Test each skill as an individual feature, using normal unit test patterns (import and execute the skill or its functions).
- Simpler is better for error handling; string matching on error messages is sufficient for now.
- Skills should be called with correct options; the skills system is responsible for parameter validation. Consider using Zod for parameter validation in the future (see placeholder story).

## Test Structure

All skill tests should follow this structure:

```typescript
describe('skillName', () => {
  let mockApi: ReturnType<typeof createMockSkillApi>;

  beforeEach(() => {
    mockApi = createMockSkillApi();
  });

  describe('metadata', () => {
    it('should have correct name', () => {
      expect(skill.name).toBe('expected-name');
    });

    it('should have description', () => {
      expect(skill.description).toBeTruthy();
    });

    it('should have execute function', () => {
      expect(typeof skill.execute).toBe('function');
    });
  });

  describe('functionality', () => {
    it('should perform expected behavior', async () => {
      // Test skill logic
    });
  });

  describe('parameter validation', () => {
    it('should validate required parameters', async () => {
      await expect(skill.execute(mockApi, {})).rejects.toThrow('Missing required parameter');
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      // Test error scenarios
    });
  });
});
```

## Documentation and Examples

- Document all test utilities, patterns, and best practices in this file to avoid duplication.
- Every new built-in skill PR should include:
  - A usage example in `skillapi-usage-examples.md`
  - Unit tests following the patterns in this document
  - Tests should cover metadata, functionality, parameter validation, and error handling

## CI Integration

- There is no CI integration at this stage.

---

For more details, see the [Create Testing Environment for Skills story](../tickets/008-skills-system-expansion/004-create-testing-environment-for-skills.md).
