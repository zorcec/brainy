---
title: Simplify Skills System to Built-in JS Only
author: <PLACEHOLDER: author>
date: 2025-11-05
status: draft
---

## Problem Statement

The current skills system is overly complex, supporting project skills, TypeScript, and process forking. This increases maintenance burden and introduces unnecessary runtime complexity.

## Goal

- Only support built-in skills that are bundled as JavaScript with the extension.
- Remove all support for project skills, TypeScript skills, and process forking.
- Execute skills in-process for simplicity and reliability.

## Acceptance Criteria

- [ ] All skills must be loaded from the built-in JS bundle.
- [ ] No code for project skills, ts-node, or child process forking remains.
- [ ] All tests are updated to match the new logic and pass.
- [ ] Documentation is updated to reflect the simplified system.

## Implementation Notes

- Refactor skill loading to only use built-in JS skills.
- Remove all code, types, and comments related to project skills, ts-node, and forking.
- Ensure skill execution is always in-process.
- Update and clean up all related tests.

## Open Questions

- Are there any workflows or users currently relying on project or TypeScript skills that need migration support or communication?
  - no
- Should we provide a migration guide or warning for users who have custom skills in their workspace?
  - no
- Are there any built-in skills that depend on features only available via process forking or TypeScript? If so, do they need to be rewritten?
  - no
- Is there a need to update documentation or onboarding materials for extension users and contributors?
  - just what is existing should be updated
- Should we add a deprecation notice or changelog entry for this breaking change?
  - no
- Are there any edge cases where in-process execution could cause issues (e.g., blocking, memory leaks, or security concerns)?
  - no


## Open Questions

- <PLACEHOLDER: Any edge cases or migration concerns?>

## Next Steps

- Review and approve this story.
- Link to related papercuts and refactoring tickets.
- Move to implementation after review.
