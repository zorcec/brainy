## Title
Implement Variables Support

## Problem
Users need to store, retrieve, and substitute variables within Brainy playbooks to enable dynamic workflows and reuse results. Without variable support, workflows are static and cannot adapt or chain results between steps.

## Solution
Implement variable support in the skills system, allowing skills to set, get, and substitute variables in playbooks. The system will support variable assignment, retrieval, and substitution in prompts and code blocks.

A new Skill API method `setVariable(name, value)` will be added. Skill logic should call this method whenever a variable should be set.

## Acceptance Criteria
- All tests are passing.
- Variables can be set, retrieved, and substituted in playbooks.
- The system supports variable assignment from skill outputs.
- Errors are surfaced for missing/invalid variables.
- Unit tests cover normal and error cases.
- Usage is documented with an example.

## Tasks/Subtasks
- [ ] Design the variables support interface and syntax
- [ ] Implement variable assignment and retrieval in the skills system
- [ ] Support variable substitution in prompts and code blocks
- [ ] Validate input and handle errors
- [ ] Write unit tests for normal and error cases
- [ ] Document usage and add an example


## Design Decisions & Open Questions

- **Case Sensitivity:** Variable names are case-sensitive.
- **Overwrites/Collisions:** No special handling; accidental overwrites or collisions are possible.
- **Undefined Variables:** If a variable is referenced before it is set, it is undefined. The Skill API will provide a `getVariable(name)` method. No error is thrown; `undefined` is returned.
- **Value Types:** Only string values are allowed for variables.
- **Scoping:** Variable scoping for playbook imports is not supported yet. All important playbooks will extend the current one at the import place, so the session and variables persist.
- **Listing Variables:** There is no way to list all currently set variables for debugging or inspection.
- **Security:** No measures are taken to prevent variable injection or security issues if user input is substituted directly into prompts or code.
- **Recursion:** Variable substitution is not recursive; only direct string replacement is supported.
- **Limits:** There is no maximum variable size or count.

## Additional Info & References
- Example usage: `@task --prompt "Summarize" --variable summary`
- Risks: variable name collisions, undefined variables
- Testability: unit tests with mock variable store
- See also: variable support in project docs
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Extend the skills system to support variable assignment and retrieval.
- Add a new Skill API method: `setVariable(name, value)`.
- Skills should call `setVariable` to assign variables.
- Implement this for the `task` skill only.
- Implement variable substitution in prompts and code blocks using a defined syntax.
- Add a variable store (in-memory or per-playbook).
- Add unit tests using the centralized mock SkillApi and variable store mock.
- Document usage in the skills system and in the testing best practices doc.

## Important code example

```ts
// Variable assignment and substitution example
// In a skill:
// Set variable: context.variables['summary'] = result;
```
