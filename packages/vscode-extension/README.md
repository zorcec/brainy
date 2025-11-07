# Brainy VS Code Extension

This extension integrates the Brainy knowledge assistant into Visual Studio Code.

## Features
- Connects to the local Brainy server for hybrid (vector + keyword) search
- Indexes and retrieves Markdown knowledge base files
- Provides commands for configuration and search

## Getting Started
1. Install dependencies and build the project:
   ```bash
   npm install
   npm run build
   ```
2. Launch VS Code and open your workspace.
3. Activate the extension. The Brainy server will start automatically.
4. Use the `Brainy: Configure Workspace` command to set up your knowledge base.

## Requirements
- Node.js 18+
- Brainy server (included in this monorepo)

## Development
- Source code: `src/`
- Unit tests: `src/extension.test.ts`
- E2E tests: `e2e/`


## Built-in Skills

Brainy comes with the following built-in skills for use in playbooks and automation:

### context
Switch to or create a named agent context. Stores messages in chronological order and manages token limits.
**Parameters:**
- `name` (string, required): Context name

### model
Set the active LLM model for subsequent requests.
**Parameters:**
- `id` (string, required): Model ID (e.g., 'gpt-4o', 'claude-3')

### task
Send a prompt to the LLM and return the response. Supports variable substitution and storing responses.
**Parameters:**
- `prompt` (string, required): Prompt text
- `model` (string, optional): Model ID
- `variable` (string, optional): Variable name to store response

### execute
Run the next code block in the playbook and capture its output.
**Parameters:**
- `variable` (string, optional): Variable name to store output

### file
Read, write, or delete files using Node.js fs API.
**Parameters:**
- `action` (string, required): 'read', 'write', or 'delete'
- `path` (string, required): File path
- `content` (string, required for write): File content

### input
Prompt the user for input and store it in a variable. Pauses execution until input is provided.
**Parameters:**
- `prompt` (string, required): Prompt text
- `variable` (string, required): Variable name to store input

### file-picker
Open a file/folder picker dialog and store selected paths in a variable.
**Parameters:**
- `variable` (string, optional): Variable name to store selected paths
- `prompt` (string, optional): Prompt text to show to the user

### document
Open a markdown document for user editing and capture content on close.
**Parameters:**
- `variable` (string, optional): Variable name to store document content
- `content` (string, optional): Initial content for the document

### dummy
Dummy skill for testing. Supports success, error, and slow modes.
**Parameters:**
- `mode` (string, optional): 'success', 'error', or 'slow'
- `message` (string, optional): Custom message
- `delay` (number, optional): Delay in ms for slow mode

For more advanced examples and testing patterns, see:
- [`information/tickets/008-skills-system-expansion/skillapi-usage-examples.md`](../../information/tickets/008-skills-system-expansion/skillapi-usage-examples.md)

## License
MIT
