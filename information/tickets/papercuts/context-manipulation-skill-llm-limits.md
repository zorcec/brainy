# Papercuts Epic: Context Manipulation Skill

## Problem
- The current context manipulation skill does not enforce LLM input limits or truncation.
- If the context exceeds LLM input limits, there is no handling or truncation.
- Playbook execution is not blocked if there are errors in the playbook (e.g., invalid context names).

## Proposed Improvements
- Add support for LLM input limits and automatic truncation of context (e.g., oldest messages removed first).
- Block playbook execution if there are errors in the playbook, with clear feedback to the user.

## Status
- Not implemented. To be addressed in future iterations.

## References
- See `006-implement-context-manipulation-skill.md` for current limitations and clarifications.
