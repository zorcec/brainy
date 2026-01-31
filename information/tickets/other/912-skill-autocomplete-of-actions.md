## Title
Skill autocomplete of actions

## Problem
Currently, skills do not provide autocomplete for available actions, making it harder for users to discover and use them efficiently.

## Solution
Implement autocomplete functionality for skill actions, ensuring users can easily select valid actions. Cover this feature with tests.

## Acceptance Criteria
- All tests are passing.
- Autocomplete suggests all valid actions for each skill.
- Invalid actions are not suggested.
- Feature is tested with various skills.

## Tasks/Subtasks
- [ ] Implement autocomplete for skill actions.
- [ ] Write tests to cover autocomplete functionality.
- [ ] Validate suggestions for edge cases.

## Open Questions
- <PLACEHOLDER: Should autocomplete be context-aware for each skill?>
- <PLACEHOLDER: Are there any performance constraints?>

## Additional Info & References
- [Project Overview](../../information/project/overview.md)
- [Developing Guideline](../../developing-guideline.md)
- [Brainy Project Overview & Architecture](../../project-overview.md)
- [README](../../README.md)

## Proposal
- Parse available actions for each skill.
- Integrate autocomplete into the skill selection UI.
- Ensure tests cover all valid and invalid scenarios.

