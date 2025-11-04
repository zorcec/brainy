## Title
<Short, action-oriented summary of the story>
> Example: Transform CSV user data into normalized JSON

## Problem
<Describe the specific problem this story should solve. Why is it important? What is the impact if not solved?>
> Example: Raw user data in CSV format contains inconsistencies (missing fields, duplicate emails, unnormalized status values) and cannot be directly consumed by downstream systems.

## Solution
<Describe the overall solution to the problem. What approach will be taken?>
> Example: Develop a process to convert the CSV file into a clean, normalized JSON array, applying data validation and transformation rules.

## Acceptance Criteria
<List what must be true for the story to be considered “done.” How will success be measured?>
- All tests are passing.
> Example:
> - Output matches the required JSON structure
> - Invalid rows are excluded
> - Duplicate emails are logged and only the first occurrence is kept
> - All constraints are enforced
> - Input/output is well tested with sample data

## Tasks/Subtasks
<Break down the story into actionable, testable tasks. Use checkboxes for each task.>
> Example:
- [ ] Parse CSV input
- [ ] Validate and clean data
- [ ] Map status values
- [ ] Handle duplicates
- [ ] Write output to JSON
- [ ] Log processing summary

## Open Questions
<List any open questions, uncertainties, or areas needing clarification.>
> Example:
> - Are there additional fields or edge cases to consider?
> - Should logging be to file or console?

## Additional Info & References
<Provide any extra context, risks, affected features, testability notes, or reviewer requirements.>
> Example:
> - Example input/output provided below
> - Risks: malformed CSV, unexpected status values
> - Testability: unit tests with sample data

<Allways add the following references:>
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
<Proposed technical solution, steps, or implementation details. Can be challenged or refined later.>
> Example:
> - Read `users.csv` with columns: `id`, `name`, `email`, `signup_date`, `status`
> - Exclude rows with missing `name` or `email`
> - Validate emails (RFC 5322)
> - Map `status`: `active` → `true`, `inactive` → `false`
> - Handle duplicate emails by keeping the first occurrence and logging duplicates
> - Output to `users.json` as an array of objects: `userId`, `fullName`, `email`, `registered`, `isActive`

## Important code example
<Parse the existing relavant code and add the important code examples of a code that has to be adapted, or added to the existing codebase.>

### Skill Object Example
```ts
// skills/file.ts
// all params are translated into flags
// @file --action "write" --path "./test.json" --content "hello world"
export interface Params {
  action: "read" | "write" | "delete";
  path: string;
  content?: string;
}

// Global type
export interface Skill {
  name: string;
  description: string;
  execute: (params: Params) => Promise<string>;
  // Params type should be exported for system introspection (consider Zod for future evolution)
}

export const fileSkill: Skill = {
  description: "Read, write and delete files.",
  async execute(params) {
    // Implementation logic here
    // Return output as string
    return "<result>";
  }
};
```

**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.