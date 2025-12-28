# Brainy Project Agent Instructions

## 🛑 MANDATORY: Context Loading
**Before performing ANY action in this codebase, you MUST:**

1.  **Read Root Documentation**: Check ALL `.md` files in the root directory:
    -   [README.md](./README.md)
    -   [project-overview.md](./project-overview.md)
    -   [CONTRIBUTORS.md](./CONTRIBUTORS.md)
    -   Any other `.md` file present in the root.

2.  **Load Global AI Instructions**:
    This project strictly adheres to the standards defined in the `ai-instructions` workspace.
    You **MUST** consider all instructions located in:
    `/home/zorcec/workspace/ai-instructions`

    **Specifically, referenced instructions:**
    -   [AI Instructions](file:///home/zorcec/workspace/ai-instructions/.github/instructions/ai.instructions.md)
    -   [Coding Instructions](file:///home/zorcec/workspace/ai-instructions/.github/instructions/coding.instructions.md)
    -   [Deep Thinking & Research](file:///home/zorcec/workspace/ai-instructions/.github/instructions/deep-thinking-research.instructions.md)
    -   [Improve Prompt](file:///home/zorcec/workspace/ai-instructions/.github/instructions/improve-prompt.instructions.md)
    -   [Information Files](file:///home/zorcec/workspace/ai-instructions/.github/instructions/information-files.instructions.md)
    -   [Instructions Writing](file:///home/zorcec/workspace/ai-instructions/.github/instructions/instructions-writing.instructions.md)
    -   [Kanban](file:///home/zorcec/workspace/ai-instructions/.github/instructions/kanban.instructions.md)
    -   [Markdown](file:///home/zorcec/workspace/ai-instructions/.github/instructions/markdown.instructions.md)
    -   [NodeJS/Vitest](file:///home/zorcec/workspace/ai-instructions/.github/instructions/nodejs-javascript-vitest.instructions.md)
    -   [Playwright](file:///home/zorcec/workspace/ai-instructions/.github/instructions/playwright-typescript.instructions.md)
    -   [Python](file:///home/zorcec/workspace/ai-instructions/.github/instructions/python.instructions.md)
    -   [ReactJS](file:///home/zorcec/workspace/ai-instructions/.github/instructions/reactjs.instructions.md)
    -   [Code Commenting](file:///home/zorcec/workspace/ai-instructions/.github/instructions/self-explanatory-code-commenting.instructions.md)
    -   [TypeScript](file:///home/zorcec/workspace/ai-instructions/.github/instructions/typescript.instructions.md)
    -   [Unit Tests](file:///home/zorcec/workspace/ai-instructions/.github/instructions/unit-tests.instructions.md)

    **Generic Search Directive:**
    If you need guidance on a topic not explicitly linked above, you **MUST** search the `ai-instructions` workspace for relevant `.md` files before proceeding.
    `find_by_name(SearchDirectory="/home/zorcec/workspace/ai-instructions", Pattern="*<topic>*")`
    
    **Research & Stories:**
    The `information/index.md` file contains an index of research and user stories.
    -   **MUST** Check `information/index.md` to key relevant research or stories.
    -   **MUST** Load those relevant files into context if they pertain to your current task.

## Project Structure
-   `packages/server`: Backend logic.
-   `packages/vscode-extension`: VS Code extension client.
