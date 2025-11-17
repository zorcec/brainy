## Blogline (Short Abstract)
Implement an MCP server to register and expose skills as LLM tools for Copilot and agent orchestration.

## WHY
Skills marked with `registerAsTool` are not accessible to LLMs or Copilot as tools. This epic solves the lack of protocol for exposing these skills, enabling agent orchestration and tool calling. Key benefits include seamless integration of project skills with LLMs, improved automation, and enhanced developer experience.

## Functional and Non-Functional Requirements
- (Functional) Discover skills with `registerAsTool: true` and register them as MCP tools
- (Functional) Expose registered tools via MCP protocol for LLM and Copilot access
- (Functional) Enable invocation of skills through MCP tool calls
- (Non-functional) Reliable and fast tool registration and execution
- (Non-functional) Maintainable architecture and clear documentation
- (Non-functional) Local server, no cloud deployment required

## Stories
- Design MCP server architecture and tool registration logic
- Implement skill discovery and MCP tool registration
- Integrate skill execution via MCP tool calls
- Add tests for registration and invocation
- Document MCP server setup and usage

## Out of Scope
- Cloud deployment of MCP server
- Registration of skills not marked with `registerAsTool: true`
- Advanced authentication and authorization mechanisms

## Risks, Edge Cases & Open Questions
- Security and authentication for tool calls
- Error handling for failed skill executions
- Compatibility with future skill API changes

## References
- MCP protocol documentation
- Existing skill system and API
- [Dummy skill example](../../packages/vscode-extension/src/skills/built-in/dummy.ts)
- [Ticket: Local skill discovery and transpilation](../013-local-skills/001-local-skill-discovery-and-transpilation.md)
- Project README and architecture docs
