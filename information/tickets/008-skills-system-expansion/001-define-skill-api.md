---
title: "Define Skill API and Implement Basic Skills"
description: "Story to define the Skill API for Brainy, implement foundational skills, and document usage."
status: "draft"
created: "2025-11-02"
---

# Story: Define Skill API and Implement Basic Skills

## Background
Brainy’s agent workflows require a modular, extensible skills system. The epic outlines the need for a clear Skill API and foundational skills. This story focuses on specifying the API, implementing basic skills, and providing usage examples.

## Goals
- Specify the Skill API object structure and requirements.
- Implement foundational skills (File Manipulation, Model Chooser, Context Manipulation, Task, Execute, Variables, Link).
- Document usage and provide code examples.
- Reference all related documents.

## Implementation Plan
- Define the Skill API object (name, description, async function).
- Implement a sample skill (e.g., file).
- Add code examples for skill definition and usage.
- Document error handling and async support.
- Reference epic and related docs.

## Skill API Specification

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

### Usage in Brainy
```markdown
@file --action "read" --path="./notes.md"
```
This invokes the `file` skill with action `read` and path `./notes.md`.
The returned text will be added to the context at later stories (once it is implemented)

### Error Handling
- Errors thrown in `file` are surfaced to the UI as messages (no error codes).
- On failure, the line turns red; tooltip shows the error message.

### Async Support
- All skills use async functions for execution.

## References
- [Epic: Skills System Expansion and API Definition](../epic.md)
- [Project Overview](../../project/overview.md)
- [Annotations Workflow](../../project/preparation/annotations-workflow.md)
- [Parser Implementation](../../project/preparation/parser.md)

## Acceptance Criteria
- Skill API is defined and documented.
- File skill is implemented and tested.
- Usage examples are provided (no advanced scenarios needed).
- Error handling and async support are documented.

## Out of Scope
- Advanced RAG queries
- External API integrations
- Skill chaining/conditional execution
- Metadata (e.g., version, author, tags) for skills

## Risks & Mitigations
- Ambiguity in API: Mitigate with clear examples and documentation.
- Skill conflicts: Use unique names and isolation.
- Params structure is sufficient for now, but skills can evolve over time.
- No security or sandboxing requirements for skill execution at this stage.

## Next Steps
- Implement additional foundational skills.
- Refine API based on feedback.
- Expand documentation and examples.
- Keep documentation minimal and focused on agent needs; less is better.
