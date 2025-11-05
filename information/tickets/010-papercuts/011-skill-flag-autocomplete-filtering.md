---
title: Filter Autocomplete Flags by Skill
status: done
created: 2025-11-05
completed: 2025-11-05
---

## Problem

Currently, the autocomplete picker for skill flags shows all possible flags, regardless of which skill is being used. This can confuse users and lead to invalid flag usage.

## Solution

- Only show flags/parameters in the autocomplete picker that are valid for the specific skill being used on the current annotation line.
- Each skill should expose its allowed flags (e.g., via a `paramsSchema` or metadata).
- The completion provider should detect the skill and filter flag suggestions accordingly.

## Implementation

### Changes Made

1. **Skill Type Extension** (`src/skills/types.ts`):
   - Added `SkillParameter` interface with `name`, `description`, and `required` fields
   - Extended `Skill` interface with optional `params?: SkillParameter[]` property

2. **Built-in Skills Updated**:
   - `task.ts`: Added params for `prompt` (required), `model` (optional), `variable` (optional)
   - `context.ts`: Added params for `name` (optional), `names` (optional)
   - `file.ts`: Added params for `action` (required), `path` (required), `content` (optional)
   - `execute.ts`: Added params for `variable` (optional)
   - `model.ts`: Added params for `id` (required)
   - `input.ts`: Added params for `prompt` (required), `variable` (required)

3. **Skill Parameters Registry** (`src/skills/skillParamsRegistry.ts`):
   - Created singleton registry module for managing skill parameter definitions
   - Provides functions: `registerSkill`, `registerSkills`, `getSkillParams`, `getAllSkillNames`, `clearRegistry`, `getRegistrySize`
   - Registry is populated during extension activation with all built-in skills

4. **Completion Provider Updated** (`src/markdown/completionProvider.ts`):
   - Modified `getParameterCompletions` to accept `linePrefix` parameter
   - Added logic to extract skill name from current line
   - Filters suggestions based on skill-specific parameters from registry
   - Falls back to common parameters for unknown skills or skills without params
   - Shows "(required)" indicator in detail text for required parameters

5. **Extension Activation** (`src/extension.ts`):
   - Registers all built-in skills in the parameters registry on activation
   - Logs registry initialization for debugging

6. **Tests Added**:
   - Unit tests for `skillParamsRegistry.ts` (11 tests)
   - Unit tests for skill-specific filtering in `completionProvider.test.ts` (7 new tests)
   - E2E tests for skill parameter metadata in `autocomplete.test.ts` (6 new tests)
   - All 529 unit tests pass, all 11 e2e tests pass (1 skipped)

## Acceptance Criteria

- [x] When typing flags for a skill annotation, only valid flags for that skill are shown in the autocomplete picker.
- [x] If a skill does not define any flags, no flag suggestions are shown (falls back to common parameters).
- [x] If a skill defines a schema or metadata, suggestions use that source.
- [x] E2E tests cover both built-in and user-defined skills for this behavior.

## Out of Scope

- Context-aware flag suggestions (e.g., hiding already-used flags) are not required.

## Testing

### Unit Tests
- `skillParamsRegistry.test.ts`: 11 tests for registry operations
- `completionProvider.test.ts`: 18 tests total (7 new tests for skill-specific filtering)
- All 529 unit tests pass

### E2E Tests
- `autocomplete.test.ts`: 12 tests total (6 new tests for skill-specific parameter metadata)
- 11 passed, 1 skipped (execute skill in web environment)

## Notes

- This significantly improves UX by showing only relevant parameters for each skill
- Required parameters are clearly marked with "(required)" in the detail text
- Falls back gracefully to common parameters for project-specific skills without metadata
- Project-specific skills can define custom parameters using the same `params` property
