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

    - Each skill must export an object with:
      - `name`: Unique skill identifier (derived from the file name)
      - `description`: Brief summary
      - `async function`: Main execution logic
    - API and params can be extended in future stories; API should return getters (details to be clarified in the story).

    - No strict types; input is defined by the system API.
    - Output is always a string.

    - Skills support async operations.
    - Errors/exceptions must be surfaced to the UI.
    - Errors from `sendRequest()` are surfaced by throwing exceptions (no structured error objects).

    - Built-in skills (shipped with the extension) always take priority over project-specific skills.
    - Skill name conflicts result in a UI error.

    - Skills are dynamically loaded: once a skill file is created, it is automatically picked up.
    - Hot-reloading and dynamic registration are supported.
    - The messaging helper/wrapper is injected at the beginning and is always available; the API uses it transparently for skills.

    - Skill execution highlights the line yellow.
    - On failure, the line turns red; tooltip on hover shows the exception message.
    - On success, the line turns green.
    - Only tooltips are planned for extensible feedback for now.

    - Skills should be tested only with unit tests. Do not use E2E tests for skill logic, as Node.js APIs are not available in browser-based environments (such as VS Code running in the browser).
    - Unit tests: Cover as much as possible for each skill.
    - Usage examples: Will be shown in tooltips (to be implemented in the papercuts epic).
    - Add a story to create a testing environment for built-in skills and cover it with tests.

    - Each skill runs in an isolated Node.js process.
    - The playbook has a global scope, but skills cannot interact with it directly.
    - Skills can only return a string, which the playbook may set as a variable.

    - No migration guides; documentation should focus on immediate usage.
    - Target audience: agents (who will likely create skills).
    - No template or standard for documenting new skills at this stage.
    - Only provide documentation and code samples needed for agents to write skills—no full API reference.

    - No current security considerations for skill execution.
    - Backward compatibility is not maintained; if the API changes, affected skills must be updated (focus is on built-in skills for now).
    - No security measures, allowlist, or permission model for exposed functions.
    - Future API changes may be breaking; old built-in skills must be updated. No versioning or feature flags.

## Skills Process Isolation and API Access

- Each skill runs in a fully isolated Node.js process.
- **Only Node.js APIs** (e.g., fs, path, child_process) are available inside skills.
- The working directory for each skill process is set to the root of the project.
- **No VS Code API** or extension context is accessible inside skills.
- Skills communicate with the main extension process via IPC (JSON-over-IPC), using the minimal SkillApi surface (sendRequest, selectModel).
- This ensures security, stability, and prevents accidental coupling to VS Code internals.

## API Surface, IPC, and Lifecycle Decisions

- The global `VscodeApi` type will only expose `sendRequest` and `selectModel`. No other VSCode extension APIs (notifications, file system, etc.) are included. No versioning or compatibility guarantees.
- IPC (JSON-over-IPC) is the chosen messaging method for communication between skill processes and the main extension process.

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
9. Create a testing environment for built-in skills and cover it with tests

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
