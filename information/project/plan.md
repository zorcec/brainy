# Next-Phase Plan: Brainy Markdown Agent Extension

## Overview
This plan outlines the next steps after completion of the VS Code Markdown (.md) support epic. It builds on the foundation of parsing, highlighting, and UI integration to deliver full agentic workflow automation, context control, and extensibility.

## Next Steps

1. **Playbook Execution Engine**
   - Move from parsing and logging to actual execution of playbook steps.
   - Implement code block execution (Bash, Python, JS) with output capture.
   - Integrate agent prompt handling and LLM responses.

2. **Context Management & Chaining**
   - Enable context isolation, chaining, and injection as described in the project overview.
   - Support context switching and combining for advanced workflows.

3. **Skill System Expansion**
   - Add support for custom skills and automation scripts in the `skills` directory.
   - Build a registry and loader for user-defined skills.

4. **UI Enhancements**
   - Add play/pause/stop controls for playbook execution.
   - Highlight the currently executing line/block.
   - Show agent requests/responses and context inspection in the editor.

5. **Copilot Integration**
   - Implement `@gh-copilot-context` sharing and context handoff to GitHub Copilot.
   - Build `/brainy.get-context {id}` tool for seamless agent interoperability.

6. **Security & Sandboxing**
   - Ensure safe execution of scripts and code blocks.
   - Add sandboxing and permission controls for user scripts.

7. **Advanced E2E & Integration Testing**
   - Expand E2E coverage to include execution, context management, and skill workflows.
   - Add integration tests for agent and Copilot handoff.

8. **Documentation & Examples**
   - Update README and module docs with execution, context, and skill usage.
   - Provide example playbooks and workflows for users.

---

*This plan will move Brainy from basic parsing and UI to full agentic workflow automation, context control, and extensibility.*
