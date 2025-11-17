## Problem
<Describe the specific problem this story should solve.>
> Example: Raw user data in CSV format contains inconsistencies (missing fields, duplicate emails, unnormalized status values) and cannot be directly consumed by downstream systems.

## Solution
<Describe the overall solution to the problem. What approach will be taken?>
> Example: Develop a process to convert the CSV file into a clean, normalized JSON array, applying data validation and transformation rules.

## Acceptance Criteria
<List what must be true for the story to be considered “done.” How will success be measured?>
- All unit and e2e tests are passing.
> Example:
> - Output matches the required JSON structure
> - Invalid rows are excluded
> - Duplicate emails are logged and only the first occurrence is kept
> - All constraints are enforced
> - Input/output is well tested with sample data

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

## Important code changes
<Parse the existing relavant code and add the important code examples of a code that has to be adapted, or added to the existing codebase.>

## Test use-case examples
<Provide specific test use-case examples that should be covered in the implementation. Provide the unit test implementation if possible.>

**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.