# Testing Best Practices for Built-in Skills

This document outlines the best practices for testing built-in skills in Brainy.

## Scope
- Only built-in skills are covered by this test environment. Project/user-defined skills are out of scope.

## Mocking and Spying
- Always import the `SkillApi` type from the real implementation and ensure the mock reflects all properties and APIs.
- A single, centralized mock SkillApi implementation must be created and reused by all built-in skill tests to ensure consistency and reduce duplication.
- Mock APIs used by skills if they are not safe for direct use (e.g., filesystem, environment variables).
- The mock API should validate that all properties and methods are present, but does not need to validate argument types beyond what TypeScript provides.

## Test Patterns
- Test each skill as an individual feature, using normal unit test patterns (import and execute the skill or its functions).
- Simpler is better for error handling; string matching on error messages is sufficient for now.
- Skills should be called with correct options; the skills system is responsible for parameter validation. Consider using Zod for parameter validation in the future (see placeholder story).

## Documentation and Examples
- Document all test utilities, patterns, and best practices in this file to avoid duplication.
- Every new built-in skill PR should include a usage example and a test case as a requirement.

## CI Integration
- There is no CI integration at this stage.

---

For more details, see the [Create Testing Environment for Skills story](../tickets/008-skills-system-expansion/004-create-testing-environment-for-skills.md).
