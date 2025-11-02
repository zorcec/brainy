---
title: "Skills System Expansion and API Definition"
description: "Epic to expand Brainy skills system, define skill API, and implement core skills."
status: "draft"
created: "2025-11-02"
---

# Epic: Skills System Expansion and API Definition

## Background
Brainy’s agent workflows rely on modular skills for automation, context control, and LLM integration. To support extensibility and robust workflows, the skills system must be expanded and its API clearly defined.

## Goals
- Define a clear, extensible Skill API for Brainy.
- Implement foundational skills:
  - File Manipulation (read/write/copy/delete)
  - Model Chooser
  - Context Manipulation (switch, combine)
  - Task Skill (sending a prompt to the LLM)
  - Execute Skill (run next code block)
  - Variables Support
  - Link Skill
- Enable future skill development and composability.
- Add a way to ship build-in skills with the vscode extension (those skills are available always, they do not need to be inside the project)

## Skill API Specification & Implementation Details

  - **Skill Object Requirements:**
    - Each skill must export an object with:
      - `name`: Unique skill identifier (derived from the file name)
      - `description`: Brief summary
      - `async function`: Main execution logic
    - API and params can be extended in future stories; API should return getters (details to be clarified in the story).

  - **Input/Output Types:**
    - No strict types; input is defined by the system API.
    - Output is always a string.

  - **Async & Error Handling:**
    - Skills support async operations.
    - Errors/exceptions must be surfaced to the UI.

  - **Built-in vs. Project Skills:**
    - Built-in skills (shipped with the extension) always take priority over project-specific skills.
    - Skill name conflicts result in a UI error.

  - **Modularity & Loader:**
    - Skills are dynamically loaded: once a skill file is created, it is automatically picked up.
    - Hot-reloading and dynamic registration are supported.

  - **UI Feedback:**
    - Skill execution highlights the line yellow.
    - On failure, the line turns red; tooltip on hover shows the exception message.
    - On success, the line turns green.
    - Only tooltips are planned for extensible feedback for now.

  - **Testing & Examples:**
    - Skills should be tested only with unit tests. Do not use E2E tests for skill logic, as Node.js APIs are not available in browser-based environments (such as VS Code running in the browser).
    - Unit tests: Cover as much as possible for each skill.
    - Usage examples: Will be shown in tooltips (to be implemented in the papercuts epic).

  - **Variables & Context:**
    - Each skill runs in an isolated Node.js process.
    - The playbook has a global scope, but skills cannot interact with it directly.
    - Skills can only return a string, which the playbook may set as a variable.

  - **Documentation:**
    - No migration guides; documentation should focus on immediate usage.
    - Target audience: agents (who will likely create skills).
    - No template or standard for documenting new skills at this stage.

  - **Risks & Compatibility:**
    - No current security considerations for skill execution.
    - Backward compatibility is not maintained; if the API changes, affected skills must be updated (focus is on built-in skills for now).

- Implementation of basic skills listed above
- Refactoring skills loader for modularity
- Unit tests and usage examples
- UI feedback for skill execution

## Acceptance Criteria
- Skill API is documented and supports all required features
- All listed skills are implemented and tested
- Skills loader supports modular addition/removal
- UI provides feedback for skill execution
- Documentation for skill development is available

## Out of Scope
- Advanced RAG queries
- External API integrations
- Skill chaining/conditional execution (future stories)

## Order of Implementation
1. Define Skill API and document
2. Implement File Manipulation Skill
3. Implement Model Chooser Skill
4. Implement Context Manipulation Skill
5. Implement Task Skill
6. Implement Execute Skill (extend API)
7. Implement Variables Support
8. Implement Link Skill
9. Refactor loader and add tests/examples

## Risks & Mitigations
- Ambiguity in API: Mitigate by thorough documentation and examples
- Skill conflicts: Use clear interfaces and isolation
- UI complexity: Start with minimal feedback, iterate

## Related Documents
- [Project Overview](../../project/overview.md)
- [Annotations Workflow](../../project/preparation/annotations-workflow.md)
- [Parser Implementation](../../project/preparation/parser.md)

## Next Steps
- Create story: "Define Skill API and implement basic skills"
- Review and iterate on API and initial skills
- Plan further skill expansion and improvements
