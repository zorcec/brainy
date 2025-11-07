# Epic: Implement LLM Tools Inspired by Open-Source Copilot Chat Extensions

## Goal
- Copy and adapt best-in-class LLM tools from top open-source Copilot Chat-like projects.
- Build a robust, extensible toolset for agentic workflows in our environment.

## Tool List (with Source Links)

- **File System Tools**
  - Read, write, delete, and list files/directories  
    - [Flexpilot: file tools](https://github.com/flexpilot-ai/vscode-extension/tree/main/src/tools)
    - [KiloCode: file tools](https://github.com/Kilo-Org/kilocode/tree/main/src/tools)

- **Code Editing Tools**
  - Insert, replace, delete, and format code in the editor  
    - [Flexpilot: code tools](https://github.com/flexpilot-ai/vscode-extension/tree/main/src/tools)
    - [Claude Coder: code actions](https://github.com/kodu-ai/claude-coder/tree/main/src/commands)

- **Terminal/Command Tools**
  - Run shell commands, show output, manage processes  
    - [Flexpilot: terminal tools](https://github.com/flexpilot-ai/vscode-extension/tree/main/src/tools)
    - [KiloCode: terminal tools](https://github.com/Kilo-Org/kilocode/tree/main/src/tools)

- **Search & Navigation Tools**
  - Search text/symbols, go to definition, find references  
    - [Flexpilot: search tools](https://github.com/flexpilot-ai/vscode-extension/tree/main/src/tools)
    - [KiloCode: navigation tools](https://github.com/Kilo-Org/kilocode/tree/main/src/tools)

- **Git/Version Control Tools**
  - Show status, diff, commit, branch management  
    - [Flexpilot: git tools](https://github.com/flexpilot-ai/vscode-extension/tree/main/src/tools)
    - [KiloCode: git tools](https://github.com/Kilo-Org/kilocode/tree/main/src/tools)

- **Chat/Agent Tools**
  - Answer questions, explain code, generate snippets  
    - [Claude Coder: chat agent](https://github.com/kodu-ai/claude-coder/tree/main/src/agent)
    - [CopilotKit: agent infra](https://github.com/CopilotKit/CopilotKit/tree/main/packages/core)

- **Test Runner Tools**
  - Run and report on tests  
    - [Flexpilot: test tools](https://github.com/flexpilot-ai/vscode-extension/tree/main/src/tools)

- **External API/LLM Integration**
  - Connect to OpenAI, Claude, Ollama, etc.  
    - [Flexpilot: LLM integration](https://github.com/flexpilot-ai/vscode-extension/tree/main/src/llm)
    - [KiloCode: LLM integration](https://github.com/Kilo-Org/kilocode/tree/main/src/llm)

- **Additional Tools**
  - Web search, documentation lookup ...
    - fetch + puppeteer to scrape and turndown to convert to md

## Next Steps
- Review and refine this list for our specific needs.
- Prioritize tools for initial implementation.
- Assign research and implementation tasks.

*All links point to the main source code directories for each tool type. Refine as needed.*
