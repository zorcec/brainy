# Papercuts: Playbook UI, Skill Autocomplete, and Context Handling Fixes

## Context
Several usability and reliability issues have been identified in the playbook execution UI and skill system. These papercuts impact user experience, agent execution, and developer productivity. Addressing them will improve workflow, reduce confusion, and ensure correct context handling.

## Problem Statement
Multiple small but impactful issues exist:
- Play button does not reappear after playbook failure.
	- Example: After a failed run, the play button remains hidden; user cannot restart.
- The execute skill fails if no code block follows the annotation.
	- Example:
		@execute --variable "test"
		(no code block)
		→ Error: No code block found after execute skill. Ensure there is a code block immediately following the @execute annotation.
- Autocomplete stops working after adding a flag in a skill.
	- Example:
		@input --prompt "your name" --variable "test"
		(variable was not offered in autocomplete)
- Input skill does not add prompt and value as user type in results.
	- Example result:
		{
			"type": "user",
			"text": "your name: [user input here]"
		}
- Model skill silently switches models if the wrong one is selected.
	- Example: If VSCode API reports wrong model, skill should throw error, not fallback.
- Task skill does not return correct user/assistant message types.
	- Example:
		@task --prompt "Great me in a nice way!"
		Result should be:
		{
			"messages": [
				{ "role": "user", "content": "Great me in a nice way!" },
				{ "role": "assistant", "content": "Hello! Nice to meet you!" }
			]
		}
- Prompt context size is not logged.
	- Example: When prompt is sent, log context size in output/log.
- Playback controls do not update correctly during execution and failure.
	- Example: Play button should hide during run, pause/stop appear; after stop/failure, play reappears, pause/stop hide.
- Task skill lacks variable and debug flag support.
	- Example: --variable flag allows variable injection; --debug returns context for debugging, no LLM call.
- Skills and text blocks are not added to context automatically.
	- Example: All skill results and text blocks/files should be added to context as agent type.
- File skill result lacks operation description and file name.
	- Example: Result should include operation description and file name, but not file content.

## Acceptance Criteria
- Play button reappears after playbook failure; pause/stop buttons update correctly.
- Playback controls are robust to edge cases: rapid clicking, multiple failures, and transitions between started, stopped, paused, and error states are handled gracefully.
- Execute skill requires a code block immediately after annotation; error is clear if missing (technical message, use VSCode output if available, otherwise show nothing).
- Autocomplete works after adding flags in skills; test generically across at least two different skills.
- Input skill result includes prompt and value as user type.
- Model skill throws error if wrong model is selected (no silent fallback; use technical message from VSCode if available).
- Task skill sends prompt as user type, response as assistant type.
- Context logging includes: number of included items, total length, and token count (if easy to implement).
- All playback controls update as expected during execution and failure.
- Task skill supports variable and debug flags; debug output dumps full context as readable JSON.
- All skills and text blocks/files add results to context automatically as agent type, from inside every skill (no performance or security limits required).
- File skill result includes operation description and file name, but not file content; use the simplest approach for operation description (standardized or free text, whichever is easier).

## Implementation Notes
- Update playbook UI state management for play/pause/stop controls.
- Explicitly test UI for edge cases: rapid clicking, multiple failures, and all state transitions (start, stop, pause, error).
- Add validation for code block presence after @execute. Error messages should be technical and use whatever is returned from VSCode; if none, show nothing.
- Fix autocomplete logic to handle flags in skills. Test generically across at least two different skills.
- Update input skill to format result as user type JSON.
- Check model selection in model skill and throw error if mismatched. Use technical error messages from VSCode if available.
- Refactor task skill to handle user/assistant message types and support flags. Debug output should dump the full context as readable JSON.
- Log context size in prompt send logic. Log should include: number of included items, total length, and token count (if easy to implement).
- Ensure all skills/text blocks/files update context as agent type. Add results from inside every skill for maximum control; no performance or security limits required.
- Update file skill to include operation description and file name only. Use the simplest approach for operation description (standardized or free text, whichever is easier).
- Add/adjust tests for all above changes.

### Examples

- **@execute with code block:**
	```javascript
	@execute --variable "test"
	```javascript
	console.log("This is a test: " + test);
	```
	→ Should execute successfully.

- **@execute without code block:**
	@execute --variable "test"
	→ Should error: No code block found after execute skill.

- **Input skill result:**
	```json
	{
		"type": "user",
		"text": "your name: [user input here]"
	}
	```

- **Task skill result:**
	```json
	{
		"messages": [
			{ "role": "user", "content": "Great me in a nice way!" },
			{ "role": "assistant", "content": "Hello! Nice to meet you!" }
		]
	}
	```

- **File skill result:**
	```json
	{
		"type": "agent",
		"operation": "read",
		"file": "example.txt"
	}
	```

## Out of Scope
- Implementation of new skills not listed above (e.g., ref skill, which is tracked separately).
- Major UI redesigns beyond control fixes.

## References
- Epic: 010-papercuts/epic.md
- Related: 010-papercuts/010-ref-skill.md
