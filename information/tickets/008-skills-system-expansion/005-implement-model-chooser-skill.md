## Title
Implement Model Chooser Skill

## Problem
Currently, users cannot programmatically switch the active LLM model within Brainy playbooks or workflows. This limits flexibility and prevents workflows from leveraging different models for different tasks. Without a model chooser skill, users must manually change the model, reducing automation and reproducibility.

## Solution
Implement a built-in skill called `model` that allows users to select the active LLM model from within a playbook or workflow. The skill will use the SkillApi's `selectChatModel` method to set the model globally. The skill will validate the model ID and provide clear error messages for invalid input. Usage will follow the pattern: `@model --id "gpt-4o"`.

## Acceptance Criteria
- All tests are passing.
- The model skill is available as a built-in skill and can be invoked from playbooks.
- The skill sets the active model using the SkillApi and validates the model ID.
- Errors are surfaced to the user if the model ID is missing or invalid.
- Unit tests cover normal and error cases.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the model skill interface and parameters
- [ ] Implement the model skill as a built-in skill
- [ ] Validate model ID input and handle errors
- [ ] Integrate with SkillApi's selectChatModel
- [ ] Write unit tests for the model skill (success and error cases)
- [ ] Document usage and add an example

## Open Questions & Clarifications
- Should the skill support listing available models, or only setting them? 
  - Accept any string, but if possible, provide autocomplete support with the supported models.
- Is there a need for validation against a dynamic list of models from the backend, or is "any string" always sufficient?
  - Any string is sufficient.
- Should the skill support an optional "silent" mode (no confirmation message), or always return a message?
  - Always send a concise string message.
- Should the skill log model changes for audit/debugging?
  - No logging needed.
- Is there a need to support aliases or user-friendly model names?
  - No.
- Should the skill handle concurrent model changes in multi-step workflows?
  - This skill sets the global/default model that skills after will use, if not overridden.

## Additional Info & References
- Example usage: `@model --id "gpt-4o"`
- Risks: invalid model IDs, unclear error messages
- Testability: unit tests with mock SkillApi
- See also: SkillApi usage examples, developing guideline

- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Create a new built-in skill in `src/skills/built-in/model.ts`.
- The skill exports a `Skill` object with `name: 'model'`, a description, and an async `execute` function.
- The `execute` function receives the SkillApi and params (expects `id` as the model ID).
- Validate that `id` is a non-empty string; throw an error if missing/invalid.
- Call `api.selectChatModel(id)` to set the model.
- Return a confirmation string (e.g., `Model set to: gpt-4o`).
- Add unit tests using the centralized mock SkillApi.
- Document usage in the skill and in the testing best practices doc.


## Important code example

### Model Skill Example
```ts
// src/skills/built-in/model.ts
import { Skill, SkillApi, SkillParams } from '../types';

export const modelSkill: Skill = {
  name: 'model',
  description: 'Set the active LLM model for subsequent requests.',
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    const { id } = params;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Missing or invalid model id');
    }
    await api.selectChatModel(id);
    return `Model set to: ${id}`;
  }
};
```

**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.
