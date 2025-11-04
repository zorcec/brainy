
## Title
Implement Context Selection and Linking Skill


## Problem
Users need to select and link multiple agent contexts (such as external markdown files, playbooks, or resources) for use during workflow execution. Without a context selection skill, context cannot be composed or reused flexibly, limiting modularity and advanced automation.


## Solution
Implement a built-in skill called `selectContext` that allows users to select one or more named agent contexts for the current workflow. The skill accepts an array of context names. When invoked, it stores the list of selected context names in the VS Code extension for the current session.

Provide an API:
- `selectContext(names: string[])`: Selects and stores the given array of context names for the session.
- `getContext(): Array<{ name: string, context: any }>`: Returns an array of objects, each containing a context name and its associated context, for all currently selected contexts.


## Acceptance Criteria
- All tests are passing.
- The selectContext skill is available as a built-in skill and can be invoked from playbooks.
- The skill stores the selected context names in the extension for the session.
- The API provides `selectContext([])` and `getContext()` as described above.
- Errors are surfaced for missing/invalid parameters.
- Unit tests cover normal and error cases.
- Usage is documented with an example.


## Tasks/Subtasks
- [ ] Design the selectContext skill interface and parameters
- [ ] Implement the selectContext skill as a built-in skill
- [ ] Implement `selectContext([])` to store selected context names
- [ ] Implement `getContext()` to return all selected contexts and their names
- [ ] Validate input and handle errors
- [ ] Write unit tests for normal and error cases
- [ ] Document usage and add an example


## Open Questions
- Should the skill support both local and remote (URL) contexts?
  - Yes, context names can refer to local or remote resources.
- How should errors be surfaced if a context cannot be loaded?
  - Errors should be surfaced clearly, indicating the problematic context name.
- Should duplicate context names be allowed?
  - Yes, but the latest selection is always used for the session.


## Additional Info & References
- Example usage: `@selectContext ["research", "summary"]`
- Risks: context not found, unsupported resource, injection errors
- Testability: unit tests with mock context loader
- See also: context control and linking in project docs

- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)


## Proposal
- Create a new built-in skill in `src/skills/built-in/selectContext.ts`.
- The skill exports a `Skill` object with `name: 'selectContext'`, a description, and an async `execute` function.
- The `execute` function receives the SkillApi and params (expects an array of context names).
- When called, it stores the selected context names in the extension for the session.
- Provide the API:
  - `selectContext(names: string[])`: Stores the selected context names.
  - `getContext(): Array<{ name: string, context: any }>`: Returns all selected contexts and their names.
- Validate input; throw errors for missing/invalid params.
- Return a confirmation string (e.g., `Contexts selected: research, summary`).
- Add unit tests using the centralized mock SkillApi and context loader mock.
- Document usage in the skill and in the testing best practices doc.



## Important code examples

### selectContext Skill Example
```ts
// src/skills/built-in/selectContext.ts
import { Skill, SkillApi, SkillParams } from '../types';

// In-memory store for selected context names (for session)
let selectedContextNames: string[] = [];

export const selectContextSkill: Skill = {
  name: 'selectContext',
  description: 'Select one or more agent contexts for the session.',
  async execute(api: SkillApi, params: SkillParams): Promise<string> {
    const { names } = params; // names: string[]
    if (!Array.isArray(names) || names.length === 0) {
      throw new Error('Missing or invalid context names');
    }
    selectedContextNames = names;
    return `Contexts selected: ${names.join(', ')}`;
  }
};

// API to get all selected contexts and their names
export function getContext(): Array<{ name: string, context: any }> {
  // Example: fetch context for each name (pseudo-code)
  return selectedContextNames.map(name => ({
    name,
    context: getContextByName(name) // Implement this to fetch the actual context
  }));
}

// Placeholder for actual context retrieval logic
function getContextByName(name: string): any {
  // Fetch or load the context for the given name
  return {};
}
```


### Skill Object Example
```ts
// skills/selectContext.ts
export interface SelectContextParams {
  names: string[];
}

export interface Skill {
  name: string;
  description: string;
  execute: (params: SelectContextParams) => Promise<string>;
}
```



**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.