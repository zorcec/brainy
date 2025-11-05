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


## Design Decisions & Open Questions

- **Supported File Types:** The list of supported file types is hardcoded and maintained manually as VS Code support changes.
- **Invalid Paths:** If a user provides a directory, symlink, or non-existent file, an error is raised during playbook parsing (live-time error).
- **Workspace Restriction:** Only files within the current project/workspace can be referenced.
- **Large/Locked Files:** Large or locked files are simply passed to the VS Code API; no special handling is done.
- **API Failures:** If the VS Code API call fails (e.g., permissions, API changes), the request fails, breaking the playbook and propagating the error to the UI. The error is colored the same as validation errors, with the exception message shown on hover.
- **Input Method:** Only explicit file path input is supported (no drag-and-drop).
- **Testing:** Integration with the VS Code chat UI is tested using easier automated methods.
- **Feedback:** The skill provides feedback only on errors, not on successful attachment.

## Additional Info & References
- See VS Code API docs: chat.createChatParticipant, ChatPromptReference
- Only files attachable via the chat UI (paperclip or #ref) are supported
- Skill must not allow unsupported file types
