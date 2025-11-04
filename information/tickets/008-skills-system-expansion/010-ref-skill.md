## Title
Implement "ref" skill for file attachment via VS Code API

## Problem
Users need a way to reference and attach files to the agent using only officially supported file types in VS Code chat. Manual file handling is error-prone and inconsistent.

## Solution
Develop a "ref" skill that accepts a file path and uses the official VS Code API to attach the file to the agent. Only files supported by the VS Code chat reference system will be allowed.

## Acceptance Criteria
- [ ] Only officially supported file types can be referenced
- [ ] Skill uses the VS Code API for file attachment
- [ ] User can provide a file path and have it attached in chat
- [ ] Error is shown for unsupported file types
- [ ] Tests cover supported and unsupported scenarios

## Tasks/Subtasks
- [ ] Research which file types are supported by VS Code chat references
- [ ] Implement file type validation logic
- [ ] Integrate with VS Code API for file attachment
- [ ] Add user input handling for file path
- [ ] Handle errors and edge cases
- [ ] Write unit and integration tests

## Open Questions
- What is the full list of officially supported file types?
- Should the skill support multiple files at once?
- How should errors be communicated to the user?

## Additional Info & References
- See VS Code API docs: chat.createChatParticipant, ChatPromptReference
- Only files attachable via the chat UI (paperclip or #ref) are supported
- Skill must not allow unsupported file types
