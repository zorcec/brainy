# Title
VS Code Markdown (.md) File Support Integration

## Blogline (Short Abstract)
Enable seamless detection, parsing, and execution of Markdown playbooks in the VS Code extension, with a UI play button for workflow automation.

## Audience & Stakeholders
- Developers using Brainy in VS Code
- Product owners and technical writers
- Extension maintainers

## WHY
- Improve workflow automation and reproducibility for agent playbooks
- Allow users to run and inspect Markdown-based workflows directly in the editor
- Enhance usability and integration of Brainy’s core features

## Functional Requirements
- Detect Markdown (.md) files in the workspace
- Provide basic highlighting support for playbook annotations
- Parse Markdown files for playbook annotations and code blocks
- Add a play button to the VS Code Markdown editor UI
- On play button press, parse the file and console log the parsed structure (preparation for future logic)
- Must be well tested with unit tests for all parsing and UI logic

## Non-Functional Requirements
- Fast and reliable file detection and parsing
- UI integration must be non-intrusive and maintain editor performance
- Code must be maintainable and extensible for future features

## Success & Completion
- Users can see a play button in the Markdown editor
- Pressing play parses the file and logs the result in the console
- Basic highlighting for playbook annotations is available
- All functional requirements are implemented and tested
- Unit tests cover all major code paths and edge cases
- E2E tests are implemented to validate UI interactions and workflow integration

## Stories
- Story: Detect Markdown files in the workspace, basic highlighting support
- Story: add play button to Markdown editor UI, when pressed Parse Markdown files for playbook content, and console log parsed output
- Story: E2E tests for play button, highlighting, and error display (to be added after initial implementation)

## Dependencies
- Existing parser and skill system implementation
- VS Code extension API for editor UI integration

## Out of Scope
- Full execution of playbooks (only parsing and logging for now)
- Advanced error handling and reporting
- Integration with server or LLMs

## Risks, Edge Cases & Open Questions
- UI clutter or performance impact in the editor
- Handling large or malformed Markdown files
- Future extensibility for more complex workflows

## References
- brainy/README.md
- brainy/project-overview.md
- brainy/information/index.md
- brainy/information/project/overview.md
- brainy/information/project/preparation/parser.md
- brainy/information/tickets/002-markdown-parser/epic.md
- brainy/information/tickets/002-markdown-parser/001-parser-core-generic-annotation-flag-extraction.md
- brainy/information/tickets/002-markdown-parser/002-code-block-context-combination-handling.md
- brainy/information/tickets/002-markdown-parser/003-comments-support.md
- brainy/information/tickets/002-markdown-parser/004-error-handling-edge-case-coverage.md
- brainy/information/tickets/002-markdown-parser/005-documentation.md
- brainy/information/tickets/002-markdown-parser/006-unit-testing-coverage.md
- brainy/information/tickets/003-skills-system/epic.md
- VS Code extension API documentation
