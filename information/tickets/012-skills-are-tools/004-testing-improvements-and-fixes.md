## Title
Refactor and expand skills e2e tests, dummy skill, and document skill

## Problem
Current e2e tests for skills and playbooks are inconsistent, incomplete, and some commands (e.g., parsePlaybook) are misused. Skills lack dedicated suites and documentation, and some tools are not fully tested end-to-end. The following improvements are required:
- All skills and tools must be checked and covered with e2e tests.
- Remove all usage of the parsePlaybook command from code and tests.
- All playbook tests that need to run the playbook should click play, or trigger a play command.
- All skills should have main use cases tested e2e, from the UI.
- All skills should have their own suite inside the e2e/skills.
- All skills e2e tests should have their own brainy.md file inside the test-project, inside test-project/skills/{skill-name}/.
- Revisit and challenge all e2e tests, their purpose and if they can be improved or simplified.
- Think if there are more use cases that can be covered and add e2e tests.
- Think if any of the tests can be speed up, or if we can get rid of some waiting and improve.
- Specification skill should be renamed to document.
- Document skill should be very simple (see below).
- Create a dummy skill for various testing cases, register as a tool, and write detailed e2e tests (highlight, tooltip, errors, Copilot chat tool registration).
  - Use dummy skill for generic testing of tool registration and LLM access, and future use cases. 
- All tests at the end have to pass.
- Add tests to make sure "dummy" tool is available for the LLM when executed as brainy playbook.
- Add e2e tests for file-picker, and every other tool. Test them really end-to-end, even if there are unit tests.

## Solution
The solution will:
- Remove all parsePlaybook command usage from code and tests.
- Refactor playbook tests to use play button/command only.
- Test all main skill use cases e2e from the UI.
- Create a dedicated e2e suite for each skill inside e2e/skills.
- Ensure each skill's e2e tests have their own minimal brainy.md file inside test-project/skills/{skill-name}/. To support more use cases, you can have as many files as needed per skill, grouped in the /skill/{skill-name} directory.
- Revisit and challenge all e2e tests, improve or simplify.
- Add more use cases and e2e tests.
- Optimize tests for speed and remove unnecessary waiting.
- Rename specification skill to document and simplify.
- Implement document skill as specified and cover with e2e tests.
- Create a dummy skill for various testing cases, register as a tool, and write detailed e2e tests (highlight, tooltip, errors, Copilot chat tool registration). Think about what makes sense, add new test cases as needed, but focus on what is currently possible. Tooltips and errors can be tested on dummy skill; main use cases for every skill should be covered.
- Always consider if a skill e2e test is applicable for all skills, and then do it only for the dummy skill to avoid testing the same functionality multiple times.
- Add tests to confirm dummy tool is available for LLM in playbook execution.
- Add e2e tests for file-picker and every other tool, covering known use cases and obvious edge-cases (no need for stress testing).
- Ensure all tests pass.

## Acceptance Criteria
- All tests pass.
- No parsePlaybook command in code or tests.
- Playbook tests use play button/command only.
- Each skill has e2e suite and minimal brainy.md files in correct location.
- All skills and tools are tested end-to-end from UI.
- Dummy skill is available to LLM and validated in playbook execution.
- File-picker and other tools have thorough e2e tests.
- Tests are optimized for speed and clarity (less is better, no targets).
- Most common negative tests (invalid input, permission errors) are included in e2e and unit tests.

## Tasks/Subtasks
- [ ] Remove all parsePlaybook command usage.
- [ ] Refactor playbook tests to use play button/command only.
- [ ] Test all main skill use cases e2e from the UI.
- [ ] Create dedicated e2e suite for each skill in e2e/skills.
- [ ] Add brainy.md for each skill in test-project/skills/{skill-name}/.
- [ ] Revisit and challenge all e2e tests, improve or simplify.
- [ ] Add more use cases and e2e tests.
- [ ] Optimize tests for speed and remove unnecessary waiting.
- [ ] Rename specification skill to document and simplify.
- [ ] Implement document skill as specified and cover with e2e tests.
- [ ] Create dummy skill and register as tool.
- [ ] Write detailed e2e tests for dummy skill (highlight, tooltip, errors, Copilot chat tool registration).
- [ ] Add tests to confirm dummy tool is available for LLM in playbook execution.
- [ ] Add e2e tests for file-picker and every other tool.
- [ ] Ensure all tests pass.

## Open Questions
- Are there additional skills or tools needing e2e coverage?
- Any specific UI interactions or edge cases to prioritize?
- Should dummy skill have extra features for testing?
- Should negative tests be added for all skills/tools? (Most common ones should be included in e2e and unit tests.)

## Additional Info & References
- Follow best practices for test speed and reliability.
- Reference brainy.create-ticket.prompt.md for process.
- Ensure all new/updated tests are documented.

## Document Skill Specification
The document skill should be very simple:

- Open a real Markdown document, created at `./.brainy/temp/document.md` inside the project.
- Allow the user to edit the document directly.
- When the document is closed:
  - The content of the document should be placed into the context.
  - If a variable is specified, the content should also be assigned to that variable.
- Cover the document skill with end-to-end (e2e) tests to ensure all functionality works as expected.

**Agent Instruction:**
- Before starting any implementation, the agent must always parse and review the above files to ensure alignment with project principles, architecture, and development guidelines.
- Agent has to understand the project structure and parse the relevant code examples before starting the story drafting or implementation.
- Agent has to provide important code examples that are relevant to the story so they can be reviewed before implementation.
- Agent should be curious and keen to explore the project, its architecture, existing code base, and guidelines to ensure high-quality contributions.