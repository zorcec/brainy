## Title
Extension API, testing, and documentation for skill management

## Problem
Users need a clear interface to manage skills, and the system must be robustly tested and documented for maintainability.

## Solution
Add extension commands for skill management, error handling, logging, and security checks. Write documentation and usage examples. Cover all new code with unit and integration tests.

## Acceptance Criteria
- All tests are passing.
- Extension commands for skill management are implemented.
- Error handling and logging are robust.
- Documentation and usage examples are complete.
- All modules are covered by unit and integration tests.

## Tasks/Subtasks
- [ ] Implement extension commands for skill management
- [ ] Add error handling and logging
- [ ] Write documentation in `README.md` and `/information/project/docs/`
- [ ] Add unit and integration tests for all modules

## Open Questions
- What documentation format is preferred?
- Are there additional API features needed for skill management?

## Additional Info & References
- Epic: Local Project Skills Pickup and Execution
- VSCode extension API docs
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Important code example
<Parse the existing relavant code and add the important code examples of a code that has to be adapted, or added to the existing codebase.>

## Files to Change (and Why)
- `src/extension.ts`: Add commands for skill management (run, reload). Integrate error handling and logging. Surface results and errors to the user.
- `src/skills/skillLoader.ts`: Ensure robust error handling and logging during skill load/execute. No registry needed; always transpile/eval on request.
- `README.md` and `/information/project/docs/`: Add documentation and usage examples for skill management.
- (New/Update) test files for all modules: Ensure coverage for commands, loader, and error handling.

## Important Code Snippets & Changes

### Extension Command: List Skills

// Listing skills can be done by scanning the .skills/ folder for .ts files (see scanLocalSkills in ticket 1)

### Extension Command: Reload Skills

// Reloading skills can be done by rescanning the .skills/ folder and updating the UI/commands

### Error Handling & Logging

```ts
// skillLoader.ts
try {
  // skill loading and execution logic (transpile/eval)
} catch (err) {
  console.error('Skill load or execution error:', err);
  throw err;
}
```

### Documentation Example
```md
# Using Local Skills in Brainy

## Listing Skills
Use the command palette: `Brainy: List Skills`

## Running a Skill
Select a skill and provide parameters as needed.

## Reloading Skills
Use `Brainy: Reload Skills` after adding or updating skill files.
```

**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.