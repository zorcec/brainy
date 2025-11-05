# Story: Editor Skill Usability Improvements

## Summary
Improve the editor experience for skills by enhancing visual distinction, discoverability, and debugging support.

## Motivation
- Skills are currently hard to distinguish and lack discoverability in the editor.
- Users need better feedback and easier debugging when working with skills.

## Acceptance Criteria
- Skills are colored purple in the editor, using a matching color from the current theme if available.
- On hover, show the skill description and all available flags/params for each skill.
- If skill execution fails (error thrown), display the skill in red and show the exception message on hover. If successful, show the result on hover.
- Inspection of the returned object is available on hover only when execution is paused.

## Out of Scope
- Changes to backend skill execution logic.
- Non-skill-related editor UI changes.

## Additional Notes
Use themed colors for all UI elements; no additional accessibility requirements.
Provide only in-app tooltips, no user documentation required.
