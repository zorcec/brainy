## Title
File-picker skill color for dashed names

## Problem
File-picker skill only changes color up to the first dash in the skill name. Skills with dashes in their names are not fully colored, leading to inconsistent UI.

## Solution
Update the file-picker skill to ensure the entire skill name is colored, even if it contains dashes. Cover this change with tests.

## Acceptance Criteria
- All tests are passing.
- Skills with dashes in their names are fully colored in the file-picker.
- No regression in color rendering for other skill names.
- Feature is tested with various skill name formats.

## Tasks/Subtasks
- [ ] Refactor file-picker skill color logic to handle dashes.
- [ ] Write tests for skill names with dashes.
- [ ] Validate color rendering for edge cases.

## Open Questions
- <PLACEHOLDER: Should color logic support other special characters?>
- <PLACEHOLDER: Are there UI themes that affect color rendering?>

## Additional Info & References
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Update color logic to apply to the full skill name, regardless of dashes.
- Add tests for skill names with multiple dashes and other formats.
