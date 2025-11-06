# Story: Simplify multiple context selection logic

**Status:** Done

**Context:**
- Current logic allowed multiple contexts to be selected, causing all new messages to be added to all selected contexts and resulting in multiple LLM messages.
- Requirement: Allow only one context to be selected at a time and simplify related logic.

**Goal:**
- Refactor context selection logic to restrict selection to a single context.
- Simplify and clean up all related code and UI logic.
- Ensure user experience is clear and error-free.

**Implementation Summary:**
- Changed `selectedContextNames: string[]` to `selectedContextName: string | undefined` in context.ts
- Updated `contextSkill.execute()` to only accept `--name` parameter (removed `--names` support)
- Updated `selectContext()` API to accept a single string instead of an array
- Updated `contextNames()` to return `string | undefined` instead of `string[]`
- Updated `getContext()` to return `Context | undefined` instead of `Context[]`
- Updated `addToContext()` in skillApi.ts to add to single context only
- Updated `getContext()` in skillApi.ts to return messages from single context
- Simplified playbook executor to handle single context
- Updated all unit tests (530 passing)
- Updated e2e test files to remove multiple context scenarios
- Removed 'duplicate context names' validation (no longer needed)

**Implementation Plan:**
- Audit current context selection and message dispatch logic.
- Update backend to enforce single context selection and remove support for multiple context names (no API should accept [] for context names).
- Remove or refactor code handling multiple context scenarios.
- Test for regressions and edge cases.

**Edge Cases & Testing:**
- Test with rapid context switching.
- Validate that only one context can be selected at any time.
- Ensure no duplicate or unintended LLM messages are sent.

**Technical Debt & Risks:**
- Risk: Refactor may break existing workflows.
- Mitigation: Add tests and review related features for impact.

**References:**
- See requirements in `tasks-collection.md`.

**Outcome:**
- Context selection is simplified and robust. Only one context can be selected at a time.

---

# Challenge Answers
- Should the UI display a warning or prevent selection if a user tries to select more than one context?
  - There is no UI, just a flag where you can specify the context name.
- Are there any exceptions where multiple context selection should be allowed?
  - No.
- Is there a preferred UI pattern for context selection (dropdown, radio buttons, etc.)?
  - There is no UI, just a skill with a flag.
- Should the change be backward compatible with any existing workflows or saved states?
  - No.
- Are there specific features or integrations that depend on the current multi-context logic?
  - No.
- Do you want to link this story to related tickets for traceability?
  - As you will.

---

# Code Changes

// Most important change: restrict to single context selection
// In contextSkill.execute, replace multiple context support with single context only
async execute(api: SkillApi, params: SkillParams): Promise<SkillResult> {
  const { name } = params;
  if (!isValidString(name)) {
    throw new Error('Missing or invalid context name');
  }
  const contextName = name.trim();
  if (!contextStore.has(contextName)) {
    contextStore.set(contextName, []);
  }
  const message = `Context set to: ${contextName}`;
  addMessageToContext(contextName, 'agent', message);
  return {
    messages: [{ role: 'agent', content: message }]
  };
}
